// Storage Service for Smart TabGuard
// Handles storage of tab summaries and AI-enhanced settings

import { TabSummary } from './summarizer';

export interface TabData {
  tabId: number;
  url: string;
  title: string;
  hasUnsavedChanges: boolean;
  summary?: TabSummary;
  lastUpdated: number;
  protectionLevel: 'none' | 'basic' | 'enhanced';
}

export interface ExtensionSettings {
  protectedSites: string[];
  aiFeaturesEnabled: boolean;
  autoSummarize: boolean;
  summaryTypes: {
    forms: 'key-points' | 'tldr';
    articles: 'teaser' | 'headline';
    documents: 'tldr' | 'key-points';
    general: 'key-points' | 'tldr';
  };
  maxSummariesPerTab: number;
  summaryRetentionDays: number;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Tab Data Management
  async saveTabData(tabData: TabData): Promise<void> {
    const key = `tab_${tabData.tabId}`;
    await chrome.storage.local.set({ [key]: tabData });
  }

  async getTabData(tabId: number): Promise<TabData | null> {
    const key = `tab_${tabId}`;
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  }

  async getAllTabData(): Promise<TabData[]> {
    const result = await chrome.storage.local.get(null);
    const tabData: TabData[] = [];
    
    for (const [key, value] of Object.entries(result)) {
      if (key.startsWith('tab_') && typeof value === 'object') {
        tabData.push(value as TabData);
      }
    }
    
    return tabData;
  }

  async removeTabData(tabId: number): Promise<void> {
    const key = `tab_${tabId}`;
    await chrome.storage.local.remove([key]);
  }

  async updateTabSummary(tabId: number, summary: TabSummary): Promise<void> {
    const tabData = await this.getTabData(tabId);
    if (tabData) {
      tabData.summary = summary;
      tabData.lastUpdated = Date.now();
      await this.saveTabData(tabData);
    }
  }

  // Settings Management
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || this.getDefaultSettings();
  }

  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await chrome.storage.sync.set({ settings: updatedSettings });
  }

  async getProtectedSites(): Promise<string[]> {
    const settings = await this.getSettings();
    return settings.protectedSites;
  }

  async addProtectedSite(site: string): Promise<void> {
    const sites = await this.getProtectedSites();
    if (!sites.includes(site)) {
      sites.push(site);
      await this.saveSettings({ protectedSites: sites });
    }
  }

  async removeProtectedSite(site: string): Promise<void> {
    const sites = await this.getProtectedSites();
    const filteredSites = sites.filter(s => s !== site);
    await this.saveSettings({ protectedSites: filteredSites });
  }

  // AI Features Management
  async isAIFeaturesEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.aiFeaturesEnabled;
  }

  async setAIFeaturesEnabled(enabled: boolean): Promise<void> {
    await this.saveSettings({ aiFeaturesEnabled: enabled });
  }

  async isAutoSummarizeEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.autoSummarize;
  }

  // Cleanup
  async cleanupOldSummaries(): Promise<void> {
    const settings = await this.getSettings();
    const retentionMs = settings.summaryRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    
    const allTabData = await this.getAllTabData();
    const tabsToClean = allTabData.filter(tab => 
      tab.lastUpdated < cutoffTime && !tab.hasUnsavedChanges
    );
    
    for (const tab of tabsToClean) {
      await this.removeTabData(tab.tabId);
    }
  }

  // Statistics
  async getStorageStats(): Promise<{
    totalTabs: number;
    tabsWithSummaries: number;
    tabsWithUnsavedChanges: number;
    protectedSites: number;
    storageUsed: number;
  }> {
    const allTabData = await this.getAllTabData();
    const settings = await this.getSettings();
    
    return {
      totalTabs: allTabData.length,
      tabsWithSummaries: allTabData.filter(tab => tab.summary).length,
      tabsWithUnsavedChanges: allTabData.filter(tab => tab.hasUnsavedChanges).length,
      protectedSites: settings.protectedSites.length,
      storageUsed: JSON.stringify(allTabData).length
    };
  }

  private getDefaultSettings(): ExtensionSettings {
    return {
      protectedSites: [],
      aiFeaturesEnabled: true,
      autoSummarize: true,
      summaryTypes: {
        forms: 'key-points',
        articles: 'teaser',
        documents: 'tldr',
        general: 'key-points'
      },
      maxSummariesPerTab: 5,
      summaryRetentionDays: 7
    };
  }
} 