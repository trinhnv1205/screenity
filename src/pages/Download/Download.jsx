import React, { useState, useCallback, useEffect } from "react";

import localforage from "localforage";

localforage.config({
  driver: localforage.INDEXEDDB,
  name: "screenity",
  version: 1,
});

// Get chunks store
const chunksStore = localforage.createInstance({
  name: "chunks",
});

const Download = () => {
  const base64ToUint8Array = (base64) => {
    const dataUrlRegex = /^data:(.*?);base64,/;
    const matches = base64.match(dataUrlRegex);
    if (matches !== null) {
      // Base64 is a data URL
      const mimeType = matches[1];
      const binaryString = atob(base64.slice(matches[0].length));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: mimeType });
    } else {
      // Base64 is a regular string
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: "video/webm" });
    }
  };

  const handleMessage = useCallback((message) => {
    if (message.type === "download-video") {
      const base64 = message.base64;
      const blob = base64ToUint8Array(base64);
      const title = message.title.replace(/[\/\\:?~<>|*"]/g, "_");
      const url = URL.createObjectURL(blob);

      chrome.downloads
        .download({
          url: url,
          filename: title,
          saveAs: true,
        })
        .catch((error) => {
          // Download was canceled (e.g. the user dismissed the "Save as"
          // dialog) or failed. Swallow it so we still clean up below.
          console.warn("Download did not complete:", error?.message || error);
        })
        .finally(() => {
          // Always revoke the object URL and close this hidden helper tab,
          // otherwise a canceled download leaks the blob and leaves an
          // orphaned background tab open.
          URL.revokeObjectURL(url);
          window.close();
        });
    } else if (message.type === "recover-indexed-db") {
      // Rewrite in localforage
      const chunkArray = [];
      chunksStore
        .iterate((value, key, iterationNumber) => {
          chunkArray.push(value.chunk);
        })
        .then(() => {
          const blob = new Blob(chunkArray, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          chrome.downloads
            .download({
              url: url,
              filename: "recovered-video.webm",
              saveAs: true,
            })
            .catch((error) => {
              console.warn(
                "Recovery download did not complete:",
                error?.message || error
              );
            })
            .finally(() => {
              URL.revokeObjectURL(url);
              // Close this tab
              window.close();
            });
        });
    }
  }, []);

  useEffect(() => {
    // Register a single, stable listener reference so the cleanup can actually
    // remove it (previously add/remove used two different inline functions, so
    // the listener was never removed).
    const listener = (message) => handleMessage(message);
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [handleMessage]);

  return <div></div>;
};

export default Download;
