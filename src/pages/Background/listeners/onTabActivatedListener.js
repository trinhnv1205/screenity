import { sendMessageTab } from "../tabManagement";

export const handleTabActivation = async (activeInfo) => {
  try {
    // Batch all storage reads into a single call instead of ~8 separate
    // round-trips on every tab activation.
    const {
      recordingStartTime,
      recording,
      restarting,
      pendingRecording,
      tabRecordedID,
      region,
      customRegion,
      recordingType,
      alarm,
      alarmTime,
    } = await chrome.storage.local.get([
      "recordingStartTime",
      "recording",
      "restarting",
      "pendingRecording",
      "tabRecordedID",
      "region",
      "customRegion",
      "recordingType",
      "alarm",
      "alarmTime",
    ]);

    // Get the activated tab
    const tab = await chrome.tabs.get(activeInfo.tabId);

    if (recording) {
      // Check if region recording and if the current tab is the recording tab
      if (tabRecordedID && tabRecordedID !== activeInfo.tabId) {
        sendMessageTab(activeInfo.tabId, { type: "hide-popup-recording" });
      } else if (
        !(
          tab.url.includes("backup.html") &&
          tab.url.includes("chrome-extension://")
        )
      ) {
        // Update the active tab reference
        chrome.storage.local.set({ activeTab: activeInfo.tabId });
      }

      // Check if it's region or customRegion recording
      if (!region && !customRegion && recordingType !== "region") {
        sendMessageTab(activeInfo.tabId, {
          type: "recording-check",
          recordingStartTime,
        });
      }
    } else if (!recording && !restarting && !pendingRecording) {
      sendMessageTab(activeInfo.tabId, { type: "recording-ended" });
    }

    // If there's a recording start time, update the UI with time
    if (recordingStartTime) {
      if (alarm) {
        const seconds = parseFloat(alarmTime);
        const time = Math.floor((Date.now() - recordingStartTime) / 1000);
        const remaining = seconds - time;
        sendMessageTab(activeInfo.tabId, {
          type: "time",
          time: remaining,
        });
      } else {
        const time = Math.floor((Date.now() - recordingStartTime) / 1000);
        sendMessageTab(activeInfo.tabId, { type: "time", time: time });
      }
    }
  } catch (error) {
    console.error("Error in handleTabActivation:", error.message);
  }
};

export const onTabActivatedListener = () => {
  chrome.tabs.onActivated.addListener(handleTabActivation);
};
