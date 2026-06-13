import { handleTabActivation } from "./onTabActivatedListener.js";

// Handles a browser window gaining focus by syncing recording UI state with the
// newly focused window's active tab (same flow as switching tabs).
const handleWindowFocusChanged = async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const tabs = await chrome.tabs.query({ active: true, windowId });
    if (tabs && tabs[0]) {
      handleTabActivation({ tabId: tabs[0].id });
    }
  } catch (error) {
    console.error("Failed to query active tab:", error);
  }
};

export const onWindowFocusChangedListener = () => {
  // Previously the handler itself was exported and merely called once at init,
  // so window focus changes were never actually observed. Register it properly.
  if (chrome.windows && chrome.windows.onFocusChanged) {
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);
  }
};
