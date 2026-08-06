// frontend/components/AutoLogout.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import apiClient from "../utils/apiClient";
import AutoLogoutModal from "./AutoLogoutModal";
import { useSessionReason } from "../hooks/useSessionReason";
import { useAuthSession } from "../hooks/useAuthSession";


const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes

export default function AutoLogout() {
  const [visible, setVisible] = useState(false);

  const inactivityTimer = useRef(null);
  const logoutStartedRef = useRef(false);

  const router = useRouter();
  const { isSecurity, isInactive } = useSessionReason();
  const { status } = useAuthSession();

  const enabled = status === "authenticated";


  useEffect(() => {
    if (isSecurity || isInactive) {
      cleanup();
    }
  }, [isSecurity, isInactive]);




  /* ----------------------------------------------------
     🕒 Reset inactivity timer
  ---------------------------------------------------- */
  function resetInactivityTimer() {
    if (!enabled) return;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      setVisible(true);
    }, INACTIVITY_LIMIT);
  }

  /* ----------------------------------------------------
     🚪 Perform logout
  ---------------------------------------------------- */
  async function handleLogout() {
    if (logoutStartedRef.current) return;

    logoutStartedRef.current = true;
    cleanup();

    try {
      await apiClient.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
          skipAuthRedirect: true,
        }
      );
    } catch {
      // Logout navigation must continue.
    }

    window.location.replace(
      "/auth/login?reason=inactive"
    );
  }

  /* ----------------------------------------------------
     🧹 Cleanup timers & listeners
  ---------------------------------------------------- */
  function cleanup() {
    setVisible(false);
    if (inactivityTimer.current)
      clearTimeout(inactivityTimer.current);
    removeListeners();
  }

  /* ----------------------------------------------------
     🎧 Activity listeners
  ---------------------------------------------------- */
  function addListeners() {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) =>
      window.addEventListener(e, resetInactivityTimer)
    );
  }

  function removeListeners() {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) =>
      window.removeEventListener(e, resetInactivityTimer)
    );
  }

  /* ----------------------------------------------------
     ▶ Enable / Disable AutoLogout based on auth
  ---------------------------------------------------- */
  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    addListeners();
    resetInactivityTimer();

    return () => cleanup();
  }, [enabled]);

  /* ----------------------------------------------------
     👀 Render modal only when needed
  ---------------------------------------------------- */
  return (
    <AutoLogoutModal
      visible={visible}
      onStay={() => {
        setVisible(false);
      
        logoutStartedRef.current = false;

        // 🔁 restart inactivity from zero
        resetInactivityTimer();
      }}

      onLogout={handleLogout}
    />
  );
}
