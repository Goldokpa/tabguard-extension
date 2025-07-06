"use strict";
// popup.ts
// Handles popup UI logic for Smart TabGuard
// Allows user to enable 'Always protect this site' and shows protection status
/**
 * Initializes the popup UI and event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentSiteElement = document.getElementById('currentSite');
    const toggleButton = document.getElementById('toggleProtectionBtn');
    // If the essential elements don't exist, don't run any logic.
    if (!currentSiteElement || !toggleButton) {
        return;
    }
    let currentHostname = '';
    let protectedSites = [];
    // 1. Get the current tab's URL to identify the site.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            currentHostname = url.hostname;
            currentSiteElement.textContent = currentHostname;
            loadProtectedSites();
        }
        else {
            currentSiteElement.textContent = 'N/A';
            toggleButton.disabled = true;
            toggleButton.textContent = 'Cannot determine site';
        }
    });
    /**
     * Loads the list of protected sites from chrome.storage and updates the UI.
     */
    function loadProtectedSites() {
        chrome.storage.sync.get(['protectedSites'], (result) => {
            protectedSites = result.protectedSites || [];
            updateButtonStatus();
        });
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
    // Handle the button click to toggle protection.
    toggleButton.addEventListener('click', () => {
        const isProtected = protectedSites.includes(currentHostname);
        if (isProtected) {
            protectedSites = protectedSites.filter(site => site !== currentHostname);
        }
        else {
            protectedSites.push(currentHostname);
        }
        chrome.storage.sync.set({ protectedSites }, () => {
            updateButtonStatus();
        });
    });
});
