"use strict";
// content.ts
// Injected into web pages to detect unsaved work (e.g., forms, inputs)
// Communicates with background script to warn before closing
let hasUnsavedChanges = false;
let isSiteProtected = false;
// 1. Check if the site is protected when the script first loads.
chrome.runtime.sendMessage({ action: 'GET_PROTECTION_STATUS', hostname: window.location.hostname }, (response) => {
    if (response && response.isProtected) {
        isSiteProtected = true;
    }
});
// 2. Detect any input on the page.
document.addEventListener('input', () => {
    if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        chrome.runtime.sendMessage({ action: 'UNSAVED_CHANGES_DETECTED' });
    }
});
/**
 * Handles form submissions by resetting the unsaved changes flag and notifying the background script.
 */
function handleFormSubmit() {
    hasUnsavedChanges = false;
    chrome.runtime.sendMessage({ action: 'CHANGES_SAVED' });
}
/**
 * Attaches submit listeners to all forms within the given root element.
 * @param rootElement - The document or element to search for forms.
 */
function attachSubmitListenersToForms(rootElement) {
    rootElement.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}
// 4. Add the 'beforeunload' event listener to warn the user.
window.addEventListener('beforeunload', (event) => {
    if (isSiteProtected && hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});
// Run the initial attachment for forms already on the page.
attachSubmitListenersToForms(document);
/**
 * Observes the DOM for dynamically added forms and attaches submit listeners to them.
 */
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    attachSubmitListenersToForms(node);
                }
            });
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });
