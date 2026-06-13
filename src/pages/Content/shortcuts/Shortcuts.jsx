import React, { useState, useEffect, useContext, useRef } from "react";

import { useHotkeys } from "react-hotkeys-hook";

// Context
import { contentStateContext } from "../context/ContentState";

const Shortcuts = ({ shortcuts }) => {
  const [contentState, setContentState] = useContext(contentStateContext);
  const contentStateRef = useRef(contentState);
  // Tracks whether push-to-talk is the reason the mic is currently on, so the
  // keyup handler only turns it back off for push-to-talk (not a manual toggle).
  const pushToTalkActiveRef = useRef(false);

  useEffect(() => {
    contentStateRef.current = contentState;
  }, [contentState]);
  /* For the record, this is the shortcuts object:
	shortcuts: {
      "start-recording": "ctrl+shift+1",
      "stop-recording": "ctrl+shift+2",
      "pause-recording": "ctrl+shift+3",
      "resume-recording": "ctrl+shift+4",
      "dismiss-recording": "ctrl+shift+5",
      "restart-recording": "ctrl+shift+6",
      "toggle-drawing-mode": "ctrl+shift+7",
    },
	*/

  // Set up all the hotkeys programmatically from the shortcuts object, without using useEffect

  /*
  useHotkeys(shortcuts["toggle-drawing-mode"], () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      drawingMode: !prevContentState.drawingMode,
    }));
  });
	*/

  // Push to talk (while Alt/Option + Shift + J key is pressed enable microphone, disable on key up)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!contentStateRef.current.pushToTalk) return;
      if (event.code === "KeyU" && event.altKey && event.shiftKey) {
        // Ignore auto-repeat keydown events while the combo stays held.
        if (pushToTalkActiveRef.current) return;
        pushToTalkActiveRef.current = true;

        setContentState((prevContentState) => ({
          ...prevContentState,
          micActive: true,
        }));

        chrome.storage.local.set({
          micActive: true,
        });

        chrome.runtime.sendMessage({
          type: "set-mic-active-tab",
          active: true,
          defaultAudioInput: contentStateRef.current.defaultAudioInput,
        });
      }
    };

    const handleKeyUp = (event) => {
      if (!contentStateRef.current.pushToTalk) return;
      if (!pushToTalkActiveRef.current) return;

      // End push-to-talk as soon as any key in the Alt+Shift+U combo is
      // released. Previously this required all three to still be held on the
      // keyup, so releasing a modifier before "U" left the mic stuck on.
      const comboStillHeld =
        event.altKey && event.shiftKey && event.code !== "KeyU";
      if (comboStillHeld) return;

      pushToTalkActiveRef.current = false;

      setContentState((prevContentState) => ({
        ...prevContentState,
        micActive: false,
      }));

      chrome.storage.local.set({
        micActive: false,
      });

      chrome.runtime.sendMessage({
        type: "set-mic-active-tab",
        active: false,
        defaultAudioInput: contentStateRef.current.defaultAudioInput,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <></>;
};

export default Shortcuts;
