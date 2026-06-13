/**
 * Waits for a content script in the specified tab to be ready.
 * @param {number} tabId - The ID of the tab to wait for.
 * @param {number} [interval=500] - The interval in ms to ping the tab.
 * @param {number} [timeout=10000] - The max timeout in ms to wait.
 * @returns {Promise<void>} Resolves when the content script responds, rejects if it times out.
 */
export const waitForContentScript = async (
  tabId,
  interval = 500,
  timeout = 10000
) => {
  return new Promise((resolve, reject) => {
    const maxAttempts = Math.floor(timeout / interval);
    let attempts = 0;

    const intervalId = setInterval(() => {
      attempts++;

      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        console.error(`❌ Content script did not respond within ${timeout}ms.`);
        reject(new Error(`Content script did not respond within ${timeout}ms`));
        return;
      }

      // Ping the content script
      chrome.tabs.sendMessage(tabId, { type: "ping" }, (response) => {
        // The content script is not guaranteed to be injected yet, so early
        // pings will set chrome.runtime.lastError ("Could not establish
        // connection"). Read it here to avoid "Unchecked runtime.lastError"
        // console spam on every poll while we wait for it to become ready.
        if (chrome.runtime.lastError) {
          return;
        }
        if (response?.status === "ready") {
          clearInterval(intervalId);
          resolve();
        }
      });
    }, interval);
  });
};
