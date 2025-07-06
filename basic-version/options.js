"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const sitesListElement = document.getElementById('protectedSitesList');
    const emptyMessageElement = document.getElementById('emptyMessage');
    let protectedSites = [];
    /**
     * Renders the list of protected sites in the options page.
     */
    function renderSitesList() {
        sitesListElement.innerHTML = '';
        if (protectedSites.length === 0) {
            emptyMessageElement.style.display = 'block';
        }
        else {
            emptyMessageElement.style.display = 'none';
            protectedSites.forEach(site => {
                const listItem = document.createElement('li');
                const siteHostname = document.createElement('span');
                siteHostname.className = 'site-hostname';
                siteHostname.textContent = site;
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-btn';
                removeButton.textContent = 'Remove';
                removeButton.dataset.site = site;
                listItem.appendChild(siteHostname);
                listItem.appendChild(removeButton);
                sitesListElement.appendChild(listItem);
            });
        }
    }
    // Load sites from storage when the page loads
    chrome.storage.sync.get(['protectedSites'], (result) => {
        protectedSites = result.protectedSites || [];
        renderSitesList();
    });
    /**
     * Handles remove button clicks using event delegation.
     */
    sitesListElement.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('remove-btn')) {
            const siteToRemove = target.dataset.site;
            if (siteToRemove) {
                protectedSites = protectedSites.filter(site => site !== siteToRemove);
                chrome.storage.sync.set({ protectedSites }, () => {
                    renderSitesList();
                });
            }
        }
    });
});
