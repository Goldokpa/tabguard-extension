document.addEventListener('DOMContentLoaded', () => {
  const sitesListElement = document.getElementById('protectedSitesList') as HTMLUListElement;
  const emptyMessageElement = document.getElementById('emptyMessage') as HTMLDivElement;
  let protectedSites: string[] = [];

  /**
   * Renders the list of protected sites in the options page.
   */
  function renderSitesList() {
    sitesListElement.innerHTML = '';
    if (protectedSites.length === 0) {
      emptyMessageElement.style.display = 'block';
    } else {
      emptyMessageElement.style.display = 'none';
      protectedSites.forEach(site => {
        const listItem = document.createElement('li');
        
        // Create a clickable link for the site
        const siteLink = document.createElement('a');
        siteLink.className = 'site-hostname';
        siteLink.textContent = site;
        siteLink.href = site.startsWith('http') ? site : 'https://' + site;
        siteLink.target = '_blank';
        siteLink.rel = 'noopener noreferrer';
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.textContent = 'Remove';
        removeButton.dataset.site = site;
        
        listItem.appendChild(siteLink);
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
    const target = event.target as HTMLElement;
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