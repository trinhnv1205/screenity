export const removeTab = async (tabId) => {
  if (tabId === null) return;

  try {
    const tab = await new Promise((resolve) => {
      chrome.tabs.get(tabId, (tab) => {
        // Reading lastError avoids an "Unchecked runtime.lastError" warning
        // when the tab no longer exists.
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(tab);
      });
    });

    if (tab && tab.id) {
      chrome.tabs.remove(tab.id);
    }
  } catch (error) {
    // Tab doesn't exist or can't be accessed
  }
};
