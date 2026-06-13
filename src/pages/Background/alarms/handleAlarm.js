import { stopRecording } from "../recording/stopRecording.js";
import { sendMessageTab } from "../tabManagement";
import { sendMessageRecord } from "../recording/sendMessageRecord.js";

// Utility to handle tab messaging logic. `tab` is optional — alarms fire
// without any tab context, so we fall back to the stored activeTab.
const handleTabMessaging = async (tab) => {
  const { activeTab } = await chrome.storage.local.get(["activeTab"]);

  try {
    const targetTab = activeTab ? await chrome.tabs.get(activeTab) : null;

    if (targetTab) {
      sendMessageTab(activeTab, { type: "stop-recording-tab" });
    } else if (tab) {
      sendMessageTab(tab.id, { type: "stop-recording-tab" });
      chrome.storage.local.set({ activeTab: tab.id });
    }
  } catch (error) {
    console.error("Error in handleTabMessaging:", error);
  }
};

export const handleAlarm = async (alarm) => {
  if (alarm.name === "recording-alarm") {
    const { recording } = await chrome.storage.local.get(["recording"]);

    if (recording) {
      stopRecording();
      sendMessageRecord({ type: "stop-recording-tab" });
      // No tab is available in the alarm context; handleTabMessaging falls
      // back to the stored activeTab. Previously this referenced an undefined
      // `tab`, throwing a ReferenceError that prevented the alarm from being
      // cleared below.
      await handleTabMessaging();
    }

    await chrome.alarms.clear("recording-alarm");
  }
};
