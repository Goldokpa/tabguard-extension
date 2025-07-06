// background.ts
// Service worker for Smart TabGuard
// Handles tab events, badge updates, and communication with content scripts
// Enhanced with AI-powered content analysis and summarization

import { SummarizerService } from './services/summarizer';
import { StorageService } from './services/storage';

/**
 * In-memory store for the state of tabs.
 * Using a Map allows for easy cleanup when a tab is closed.
 */
const tabState = new Map<number, { hasUnsavedChanges: boolean }>();

// Initialize services
const summarizerService = SummarizerService.getInstance();
const storageService = StorageService.getInstance();

// Track summarization status
const summarizationStatus = new Map<number, {
  isProcessing: boolean;
  lastAttempt: number;
  errorCount: number;
}>();

// --- Helper Functions ---

/**
 * Updates the extension icon for a given tab based on its unsaved changes and protection status.
 * @param tabId - The ID of the tab to update.
 */
async function updateIcon(tabId: number) {
  const state = tabState.get(tabId);
  
  if (!state || !state.hasUnsavedChanges) {
    // Revert to the default icon if there are no unsaved changes.
    chrome.action.setIcon({
      tabId: tabId,
      path: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    });
    return;
  }
  
  // Get the tab's URL to check if it's a protected site.
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url) return;
  
  const url = new URL(tab.url);
  const hostname = url.hostname;
  
  chrome.storage.sync.get(['protectedSites'], (result) => {
    const protectedSites: string[] = result.protectedSites || [];
    if (protectedSites.includes(hostname)) {
      // Set the "warning" icon if the site is protected and has unsaved changes.
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          "16": "icons/icon16-warning.png",
          "32": "icons/icon32-warning.png",
          "48": "icons/icon48-warning.png",
          "128": "icons/icon128-warning.png"
        }
      });
    }
  });
}

/**
 * Extracts content from a tab for analysis
 */
async function extractTabContent(tabId: number): Promise<string> {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Extract main content, prioritizing article content
        const selectors = [
          'article',
          '[role="main"]',
          'main',
          '.content',
          '.post-content',
          '.entry-content',
          'body'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.trim().length > 100) {
            return element.textContent.trim();
          }
        }
        
        return document.body.textContent?.trim() || '';
      }
    });
    
    return result.result || '';
  } catch (error) {
    console.error('Failed to extract content from tab:', tabId, error);
    return '';
  }
}

/**
 * Determines if a tab should be summarized based on content and settings
 */
async function shouldSummarizeTab(tabId: number, url: string, content: string): Promise<boolean> {
  // Check if AI features are enabled
  const aiEnabled = await storageService.isAIFeaturesEnabled();
  if (!aiEnabled) return false;
  
  // Check if summarizer is supported
  const isSupported = await summarizerService.isSupported();
  if (!isSupported) return false;
  
  // Check if we've already processed this tab recently
  const status = summarizationStatus.get(tabId);
  if (status && status.isProcessing) return false;
  
  // Check if content is substantial enough
  if (content.length < 200) return false;
  
  // Check if it's a protected site
  const protectedSites = await storageService.getProtectedSites();
  const hostname = new URL(url).hostname;
  if (protectedSites.includes(hostname)) return true;
  
  // Check if auto-summarize is enabled
  const autoSummarize = await storageService.isAutoSummarizeEnabled();
  if (!autoSummarize) return false;
  
  // Check content type - prioritize certain types
  const urlLower = url.toLowerCase();
  if (urlLower.includes('blog') || urlLower.includes('article') || 
      urlLower.includes('news') || urlLower.includes('docs')) {
    return true;
  }
  
  return false;
}

/**
 * Generates and stores a summary for a tab
 */
async function generateTabSummary(tabId: number, url: string, title: string, content: string) {
  try {
    // Mark as processing
    summarizationStatus.set(tabId, {
      isProcessing: true,
      lastAttempt: Date.now(),
      errorCount: 0
    });
    
    // Initialize summarizer if needed
    await summarizerService.initialize();
    
    // Generate summary
    const summary = await summarizerService.generateTabSummary(tabId, url, title, content);
    
    // Store the summary
    await storageService.updateTabSummary(tabId, summary);
    
    console.log(`Generated summary for tab ${tabId}: ${title}`);
    
    // Update status
    summarizationStatus.set(tabId, {
      isProcessing: false,
      lastAttempt: Date.now(),
      errorCount: 0
    });
    
  } catch (error) {
    console.error('Failed to generate summary for tab:', tabId, error);
    
    // Update error count
    const status = summarizationStatus.get(tabId);
    if (status) {
      status.isProcessing = false;
      status.errorCount++;
    }
  }
}

/**
 * Handles tab updates and triggers content analysis
 */
async function handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
  if (!tab.url || !tab.title || changeInfo.status !== 'complete') return;
  
  // Skip certain URL types
  const url = new URL(tab.url);
  if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') return;
  
  // Extract content
  const content = await extractTabContent(tabId);
  if (!content) return;
  
  // Check if we should summarize
  if (await shouldSummarizeTab(tabId, tab.url, content)) {
    // Delay to ensure page is fully loaded
    setTimeout(() => {
      generateTabSummary(tabId, tab.url!, tab.title!, content);
    }, 2000);
  }
  
  // Store basic tab data
  const tabData = {
    tabId,
    url: tab.url,
    title: tab.title,
    hasUnsavedChanges: tabState.get(tabId)?.hasUnsavedChanges || false,
    lastUpdated: Date.now(),
    protectionLevel: 'none' as const
  };
  
  await storageService.saveTabData(tabData);
}

// --- Event Listeners ---

/**
 * Handles messages from content scripts or the popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  switch (message.action) {
    case 'UNSAVED_CHANGES_DETECTED':
      tabState.set(tabId, { hasUnsavedChanges: true });
      updateIcon(tabId);
      break;
    
    case 'CHANGES_SAVED':
      tabState.set(tabId, { hasUnsavedChanges: false });
      updateIcon(tabId);
      break;
    
    case 'GET_PROTECTION_STATUS':
      const hostname = message.hostname;
      chrome.storage.sync.get(['protectedSites'], (result) => {
        const isProtected = (result.protectedSites || []).includes(hostname);
        sendResponse({ isProtected });
      });
      return true;
      
    case 'GENERATE_SUMMARY':
      // Handle manual summary generation request
      chrome.tabs.get(tabId, async (tab) => {
        if (tab.url && tab.title) {
          const content = await extractTabContent(tabId);
          if (content) {
            generateTabSummary(tabId, tab.url, tab.title, content);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No content found' });
          }
        }
      });
      return true;
      
    case 'GET_TAB_SUMMARY':
      // Return stored summary for a tab
      storageService.getTabData(tabId).then((tabData) => {
        sendResponse({ summary: tabData?.summary || null });
      });
      return true;
      
    case 'CHECK_AI_STATUS':
      // Check if AI features are supported and available
      summarizerService.isSupported().then((supported) => {
        sendResponse({ supported });
      });
      return true;
      
    case 'CONTENT_ANALYSIS_COMPLETE':
      // Handle content analysis from content script
      if (message.analysis) {
        const analysis = message.analysis;
        console.log('Content analysis received:', analysis);
        
        // Store analysis data for potential use in summarization
        // This could be used to determine summarization strategy
        if (analysis.contentType === 'form' && analysis.riskLevel === 'high') {
          // Prioritize form pages with high risk
          console.log('High-risk form detected, prioritizing protection');
        }
      }
      break;
  }
});

/**
 * Cleans up the state when a tab is closed.
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabState.has(tabId)) {
    tabState.delete(tabId);
  }
  if (summarizationStatus.has(tabId)) {
    summarizationStatus.delete(tabId);
  }
  // Clean up stored data
  storageService.removeTabData(tabId);
});

/**
 * Handles tab updates for content analysis
 */
chrome.tabs.onUpdated.addListener(handleTabUpdate);

/**
 * Initialize services and perform cleanup on startup
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    // Initialize summarizer service
    await summarizerService.initialize();
    
    // Clean up old summaries
    await storageService.cleanupOldSummaries();
    
    console.log('Smart TabGuard background script initialized');
  } catch (error) {
    console.error('Failed to initialize background script:', error);
  }
});

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    const defaultSettings = {
      protectedSites: [],
      aiFeaturesEnabled: true,
      autoSummarize: true,
      summaryTypes: {
        forms: 'key-points' as const,
        articles: 'teaser' as const,
        documents: 'tldr' as const,
        general: 'key-points' as const
      },
      maxSummariesPerTab: 5,
      summaryRetentionDays: 7
    };
    
    await storageService.saveSettings(defaultSettings);
    console.log('Smart TabGuard installed with default settings');
  }
}); 