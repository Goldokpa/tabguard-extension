"use strict";
// background.ts
// Service worker for Smart TabGuard
// Handles tab events, badge updates, and communication with content scripts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * In-memory store for the state of tabs.
 * Using a Map allows for easy cleanup when a tab is closed.
 */
const tabState = new Map();
// --- Helper Functions ---
/**
 * Updates the extension icon for a given tab based on its unsaved changes and protection status.
 * @param tabId - The ID of the tab to update.
 */
function updateIcon(tabId) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const tab = yield chrome.tabs.get(tabId);
        if (!tab.url)
            return;
        const url = new URL(tab.url);
        const hostname = url.hostname;
        chrome.storage.sync.get(['protectedSites'], (result) => {
            const protectedSites = result.protectedSites || [];
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
    });
}
// --- Event Listeners ---
/**
 * Handles messages from content scripts or the popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    var _a;
    const tabId = (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id;
    if (!tabId)
        return;
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
            // Return true to indicate that we will send a response asynchronously.
            return true;
    }
});
/**
 * Cleans up the state when a tab is closed.
 */
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabState.has(tabId)) {
        tabState.delete(tabId);
    }
});
// Listen for tab updates, removals, etc.
// chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
//   // TODO: Handle tab close event
// });
// Listen for messages from content scripts or popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   // TODO: Handle messages
// }); 
