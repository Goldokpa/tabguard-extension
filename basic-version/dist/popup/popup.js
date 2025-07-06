"use strict";
// popup.ts
// Handles popup UI logic for Smart TabGuard
// Enhanced with AI features, tab summaries, and smart recommendations
/**
 * Initializes the popup UI and event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const currentSiteElement = document.getElementById('currentSite');
    const toggleButton = document.getElementById('toggleProtectionBtn');
    const aiStatusIndicator = document.getElementById('statusIndicator');
    const aiStatusText = document.getElementById('statusText');
    const aiToggle = document.getElementById('aiToggle');
    const autoSummarizeToggle = document.getElementById('autoSummarizeToggle');
    const generateSummaryBtn = document.getElementById('generateSummaryBtn');
    const summaryContent = document.getElementById('summaryContent');
    const summaryMeta = document.getElementById('summaryMeta');
    const recommendations = document.getElementById('recommendations');
    const openOptionsBtn = document.getElementById('openOptionsBtn');
    // If essential elements don't exist, don't run any logic
    if (!currentSiteElement || !toggleButton) {
        return;
    }
    let currentHostname = '';
    let currentTabId = 0;
    let protectedSites = [];
    let settings = null;
    // Initialize popup
    initializePopup();
    /**
     * Initialize the popup with current tab data and settings
     */
    async function initializePopup() {
        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && tabs[0].url) {
                const url = new URL(tabs[0].url);
                currentHostname = url.hostname;
                currentTabId = tabs[0].id;
                currentSiteElement.textContent = currentHostname;
                // Load settings and protected sites
                await loadSettings();
                await loadProtectedSites();
                // Check AI status
                await checkAIStatus();
                // Load tab summary
                await loadTabSummary();
                // Generate recommendations
                await generateRecommendations();
            }
            else {
                currentSiteElement.textContent = 'N/A';
                toggleButton.disabled = true;
                toggleButton.textContent = 'Cannot determine site';
            }
        }
        catch (error) {
            console.error('Failed to initialize popup:', error);
        }
    }
    /**
     * Load extension settings
     */
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            settings = result.settings || getDefaultSettings();
            // Update UI with current settings
            if (settings) {
                aiToggle.checked = settings.aiFeaturesEnabled;
                autoSummarizeToggle.checked = settings.autoSummarize;
            }
            // Add event listeners for toggles
            aiToggle.addEventListener('change', async () => {
                await updateSetting('aiFeaturesEnabled', aiToggle.checked);
            });
            autoSummarizeToggle.addEventListener('change', async () => {
                await updateSetting('autoSummarize', autoSummarizeToggle.checked);
            });
        }
        catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    /**
     * Load protected sites list
     */
    async function loadProtectedSites() {
        try {
            const result = await chrome.storage.sync.get(['protectedSites']);
            protectedSites = result.protectedSites || [];
            updateButtonStatus();
        }
        catch (error) {
            console.error('Failed to load protected sites:', error);
        }
    }
    /**
     * Check AI features status
     */
    async function checkAIStatus() {
        try {
            // Send message to background script to check AI status
            const response = await chrome.runtime.sendMessage({
                action: 'CHECK_AI_STATUS'
            });
            if (response && response.supported) {
                aiStatusIndicator.className = 'status-indicator available';
                aiStatusText.textContent = 'AI features available';
                generateSummaryBtn.disabled = false;
            }
            else {
                aiStatusIndicator.className = 'status-indicator unavailable';
                aiStatusText.textContent = 'AI features not available';
                generateSummaryBtn.disabled = true;
            }
        }
        catch (error) {
            aiStatusIndicator.className = 'status-indicator error';
            aiStatusText.textContent = 'Error checking AI status';
            generateSummaryBtn.disabled = true;
        }
    }
    /**
     * Load tab summary for current tab
     */
    async function loadTabSummary() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'GET_TAB_SUMMARY',
                tabId: currentTabId
            });
            if (response && response.summary) {
                displaySummary(response.summary);
            }
            else {
                displayNoSummary();
            }
        }
        catch (error) {
            console.error('Failed to load tab summary:', error);
            displayNoSummary();
        }
    }
    /**
     * Display tab summary
     */
    function displaySummary(summary) {
        summaryContent.innerHTML = `
      <div class="summary-text">${summary.summary}</div>
    `;
        const timestamp = new Date(summary.timestamp).toLocaleString();
        summaryMeta.innerHTML = `
      <div class="summary-info">
        <span class="summary-type">${summary.type}</span>
        <span class="summary-length">${summary.length}</span>
        <span class="summary-time">${timestamp}</span>
      </div>
    `;
    }
    /**
     * Display no summary message
     */
    function displayNoSummary() {
        summaryContent.innerHTML = '<p class="no-summary">No summary available for this tab.</p>';
        summaryMeta.innerHTML = '';
    }
    /**
     * Generate smart recommendations
     */
    async function generateRecommendations() {
        try {
            const recommendationsList = [];
            // Check if site should be protected
            if (!protectedSites.includes(currentHostname)) {
                recommendationsList.push({
                    type: 'protection',
                    text: 'Consider protecting this site to prevent accidental tab closure',
                    action: 'Protect Site'
                });
            }
            // Check if AI features are disabled
            if (settings && !settings.aiFeaturesEnabled) {
                recommendationsList.push({
                    type: 'ai',
                    text: 'Enable AI features to get smart tab summaries',
                    action: 'Enable AI'
                });
            }
            // Display recommendations
            if (recommendationsList.length > 0) {
                const recommendationsHtml = recommendationsList.map(rec => `
          <div class="recommendation ${rec.type}">
            <p>${rec.text}</p>
            <button class="btn btn-small" data-action="${rec.action}">${rec.action}</button>
          </div>
        `).join('');
                recommendations.innerHTML = recommendationsHtml;
            }
            else {
                recommendations.innerHTML = '<p>No recommendations at this time.</p>';
            }
        }
        catch (error) {
            console.error('Failed to generate recommendations:', error);
            recommendations.innerHTML = '<p>Unable to load recommendations.</p>';
        }
    }
    /**
     * Update a setting
     */
    async function updateSetting(key, value) {
        if (!settings)
            return;
        try {
            settings[key] = value;
            await chrome.storage.sync.set({ settings });
        }
        catch (error) {
            console.error('Failed to update setting:', error);
        }
    }
    /**
     * Updates the button text and style based on protection status.
     */
    function updateButtonStatus() {
        if (protectedSites.includes(currentHostname)) {
            toggleButton.textContent = 'Unprotect this Site';
            toggleButton.classList.add('protected');
        }
        else {
            toggleButton.textContent = 'Protect this Site';
            toggleButton.classList.remove('protected');
        }
    }
    // Event Listeners
    // Handle protection toggle
    toggleButton.addEventListener('click', async () => {
        const isProtected = protectedSites.includes(currentHostname);
        if (isProtected) {
            protectedSites = protectedSites.filter(site => site !== currentHostname);
        }
        else {
            protectedSites.push(currentHostname);
        }
        try {
            await chrome.storage.sync.set({ protectedSites });
            updateButtonStatus();
            await generateRecommendations(); // Refresh recommendations
        }
        catch (error) {
            console.error('Failed to update protected sites:', error);
        }
    });
    // Handle manual summary generation
    generateSummaryBtn.addEventListener('click', async () => {
        try {
            generateSummaryBtn.disabled = true;
            generateSummaryBtn.textContent = 'Generating...';
            const response = await chrome.runtime.sendMessage({
                action: 'GENERATE_SUMMARY',
                tabId: currentTabId
            });
            if (response && response.success) {
                // Reload summary after generation
                setTimeout(loadTabSummary, 1000);
            }
            else {
                console.error('Failed to generate summary:', response?.error);
            }
        }
        catch (error) {
            console.error('Failed to generate summary:', error);
        }
        finally {
            generateSummaryBtn.disabled = false;
            generateSummaryBtn.textContent = 'Generate Summary';
        }
    });
    // Handle recommendations actions
    recommendations.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName === 'BUTTON') {
            const action = target.getAttribute('data-action');
            if (action === 'Protect Site') {
                protectedSites.push(currentHostname);
                await chrome.storage.sync.set({ protectedSites });
                updateButtonStatus();
                await generateRecommendations();
            }
            else if (action === 'Enable AI') {
                aiToggle.checked = true;
                await updateSetting('aiFeaturesEnabled', true);
                await generateRecommendations();
            }
        }
    });
    // Handle options button
    openOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    /**
     * Get default settings
     */
    function getDefaultSettings() {
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
});
