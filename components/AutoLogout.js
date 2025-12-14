// frontend/components/AutoLogout.js
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import apiClient from "../utils/apiClient";

/**
 * 🕒 AutoLogout — IranConnect (SECURE)
 *
 * - Logout واقعی از Backend
 * - سازگار با HttpOnly Cookie
 * - بدون localStorage
 * - Race-condition safe
 *
 * timeout پیش‌فرض: 3 دقیقه (180000ms)
 */

export default function AutoLogout({ timeout = 180000 }) {
  const router = useRouter();
  const timerRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  /* ----------------------------------------------------
     🔐 Logout واقعی
  ---------------------------------------------------- */
  const logoutUser = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    console.warn("🔒 Auto-logout: user inactive");

    try {
      await apiClient.post(
        "/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.warn("Auto-logout backend error:", err);
      // حتی اگر backend fail شود، کاربر نباید در UI بماند
    } finally {
      router.replace("/auth/login");
    }
  }, [router]);

  /* ----------------------------------------------------
     ♻️ Reset inactivity timer
  ---------------------------------------------------- */
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logoutUser, timeout);
  }, [logoutUser, timeout]);

  /* ----------------------------------------------------
     🧠 Activity listeners
  ---------------------------------------------------- */
  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    // شروع تایمر
    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return null;
}
