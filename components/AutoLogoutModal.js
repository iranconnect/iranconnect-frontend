// frontend/components/AutoLogoutModal.js
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ⏳ AutoLogoutModal — IranConnect (SECURE)
 *
 * - بدون دسترسی به token
 * - فقط کنترل UX
 * - Race-condition safe
 * - ESC key support
 */

export default function AutoLogoutModal({
  visible,
  onStay,
  onLogout,
  warningTime = 30000, // ms
}) {
  const [secondsLeft, setSecondsLeft] = useState(warningTime / 1000);

  const intervalRef = useRef(null);
  const hasLoggedOutRef = useRef(false);

  /* ----------------------------------------------------
     🔒 Logout (safe, only once)
  ---------------------------------------------------- */
  const safeLogout = useCallback(() => {
    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;

    clearInterval(intervalRef.current);
    onLogout();
  }, [onLogout]);

  /* ----------------------------------------------------
     ⏳ Countdown logic
  ---------------------------------------------------- */
  useEffect(() => {
    if (!visible) {
      clearInterval(intervalRef.current);
      hasLoggedOutRef.current = false;
      return;
    }

    setSecondsLeft(Math.floor(warningTime / 1000));
    hasLoggedOutRef.current = false;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          safeLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [visible, warningTime, safeLogout]);

  /* ----------------------------------------------------
     ⌨️ ESC → Stay
  ---------------------------------------------------- */
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearInterval(intervalRef.current);
        onStay();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, onStay]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-[#0a1d37] p-6 rounded-2xl shadow-2xl max-w-sm w-[90%] text-center border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-3 text-[#0A1D37] dark:text-white">
          Are you still there?
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          Your session will expire in{' '}
          <strong className="text-[#00bfa6]">
            {secondsLeft}
          </strong>{' '}
          seconds.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              clearInterval(intervalRef.current);
              onStay();
            }}
            className="px-4 py-2 rounded-lg bg-[#00bfa6] text-white font-medium shadow-md hover:opacity-90 transition"
          >
            I’m here
          </button>

          <button
            onClick={safeLogout}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium shadow-md hover:opacity-90 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
