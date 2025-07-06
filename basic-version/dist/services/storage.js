// Storage Service for Smart TabGuard
// Handles storage of tab summaries and AI-enhanced settings
export class StorageService {
    constructor() { }
    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }
    // Tab Data Management
    async saveTabData(tabData) {
        const key = `tab_${tabData.tabId}`;
        await chrome.storage.local.set({ [key]: tabData });
    }
    async getTabData(tabId) {
        const key = `tab_${tabId}`;
        const result = await chrome.storage.local.get([key]);
        return result[key] || null;
    }
    async getAllTabData() {
        const result = await chrome.storage.local.get(null);
        const tabData = [];
        for (const [key, value] of Object.entries(result)) {
            if (key.startsWith('tab_') && typeof value === 'object') {
                tabData.push(value);
            }
        }
        return tabData;
    }
    async removeTabData(tabId) {
        const key = `tab_${tabId}`;
        await chrome.storage.local.remove([key]);
    }
    async updateTabSummary(tabId, summary) {
        const tabData = await this.getTabData(tabId);
        if (tabData) {
            tabData.summary = summary;
            tabData.lastUpdated = Date.now();
            await this.saveTabData(tabData);
        }
    }
    // Settings Management
    async getSettings() {
        const result = await chrome.storage.sync.get(['settings']);
        return result.settings || this.getDefaultSettings();
    }
    async saveSettings(settings) {
        const currentSettings = await this.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        await chrome.storage.sync.set({ settings: updatedSettings });
    }
    async getProtectedSites() {
        const settings = await this.getSettings();
        return settings.protectedSites;
    }
    async addProtectedSite(site) {
        const sites = await this.getProtectedSites();
        if (!sites.includes(site)) {
            sites.push(site);
            await this.saveSettings({ protectedSites: sites });
        }
    }
    async removeProtectedSite(site) {
        const sites = await this.getProtectedSites();
        const filteredSites = sites.filter(s => s !== site);
        await this.saveSettings({ protectedSites: filteredSites });
    }
    // AI Features Management
    async isAIFeaturesEnabled() {
        const settings = await this.getSettings();
        return settings.aiFeaturesEnabled;
    }
    async setAIFeaturesEnabled(enabled) {
        await this.saveSettings({ aiFeaturesEnabled: enabled });
    }
    async isAutoSummarizeEnabled() {
        const settings = await this.getSettings();
        return settings.autoSummarize;
    }
    // Cleanup
    async cleanupOldSummaries() {
        const settings = await this.getSettings();
        const retentionMs = settings.summaryRetentionDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - retentionMs;
        const allTabData = await this.getAllTabData();
        const tabsToClean = allTabData.filter(tab => tab.lastUpdated < cutoffTime && !tab.hasUnsavedChanges);
        for (const tab of tabsToClean) {
            await this.removeTabData(tab.tabId);
        }
    }
    // Statistics
    async getStorageStats() {
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
    getDefaultSettings() {
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
