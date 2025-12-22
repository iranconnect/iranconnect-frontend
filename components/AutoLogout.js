// frontend/components/AutoLogout.js
import { useEffect, useRef, useState } from "react";
import apiClient from "../utils/apiClient";
import AutoLogoutModal from "./AutoLogoutModal";

const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes
const LOGOUT_COUNTDOWN = 30 * 1000; // 30 seconds

export default function AutoLogout() {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const inactivityTimer = useRef(null);
  const logoutTimer = useRef(null);

  /* ----------------------------------------------------
     🔐 Check authentication via HttpOnly cookie
  ---------------------------------------------------- */
  async function checkAuth() {
    try {
      const res = await apiClient.get("/auth/me", {
        withCredentials: true,
      });
      setEnabled(!!res.data?.ok);
    } catch {
      setEnabled(false);
    }
  }

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
      startLogoutCountdown();
    }, INACTIVITY_LIMIT);
  }

  /* ----------------------------------------------------
     ⏳ Start auto logout countdown
  ---------------------------------------------------- */
  function startLogoutCountdown() {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }

    logoutTimer.current = setTimeout(() => {
      handleLogout();
    }, LOGOUT_COUNTDOWN);
  }

  /* ----------------------------------------------------
     🚪 Perform logout
  ---------------------------------------------------- */
  async function handleLogout() {
    try {
      await apiClient.post(
        "/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch {}

    cleanup();
    setTimeout(() => {
      window.location.href = "/auth/login?reason=inactive";
    }, 0);
  }

  /* ----------------------------------------------------
     🧹 Cleanup timers & listeners
  ---------------------------------------------------- */
  function cleanup() {
    setVisible(false);
    setEnabled(false);

    if (inactivityTimer.current)
      clearTimeout(inactivityTimer.current);
    if (logoutTimer.current)
      clearTimeout(logoutTimer.current);

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
     🔁 Initial auth check (once)
  ---------------------------------------------------- */
  useEffect(() => {
    checkAuth();
  }, []);

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
        resetInactivityTimer();
      }}
      onLogout={handleLogout}
    />
  );
}
