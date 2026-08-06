// frontend/components/admin/Topbar.jsx

import { useState, useCallback } from "react";
import { logoutAndRedirect } from "../../utils/logoutAndRedirect";

export default function Topbar({ toggleTheme, currentTheme }) {
  const [loggingOut, setLoggingOut] = useState(false);

  /* ----------------------------------------------------
     🔐 Secure Logout (HttpOnly Cookie Based)
  ------------------------------------------------------*/
  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    await logoutAndRedirect();
  }, [loggingOut]);

  return (
    <div className="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-40 shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] transition">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        
        {/* Page Title */}
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Manage IranConnect data
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)] hover:scale-[1.03] transition"
          >
            {currentTheme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`px-4 py-2 text-sm rounded-lg text-white transition
              ${
                loggingOut
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-turquoise hover:bg-turquoise/90 shadow-[4px_4px_10px_#b8e0dd,-4px_-4px_10px_#ffffff]"
              }
            `}
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>

      </div>
    </div>
  );
}
