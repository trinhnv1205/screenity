export const focusTab = async (tabId) => {
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
      chrome.windows.update(tab.windowId, { focused: true }).then(() => {
        chrome.tabs.update(tab.id, { active: true });
      });
    }
  } catch (error) {
    // Tab doesn't exist or can't be accessed
  }
};
