// frontend/components/admin/AdminLayout.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import apiClient from "../../utils/apiClient.js";
import { useSentryBaseContext } from "../../hooks/useSentryBaseContext";
import { SentryContextReady } from "../../hooks/useSentryContextStatus";



export default function AdminLayout({ children }) {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);

  /* 🟢 Sentry base context (role + page) */
  const sentryReady = useSentryBaseContext({ role });

  /* -------------------------------------------------------
     🟦 1) بررسی سشن و نقش (HttpOnly Cookie)
  ---------------------------------------------------------*/
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const res = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!mounted) return;

        const role = res?.data?.role;

        if (!role) {
          router.replace("/auth/login");
          return;
        }

        if (role !== "admin" && role !== "superadmin") {
          router.replace("/");
          return;
        }
        
        setRole(role);          // ← این خط جدید
        setAuthorized(true);

      } catch (err) {
        router.replace("/auth/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* -------------------------------------------------------
     🎨 2) مدیریت تم (Preference فقط – امن)
  ---------------------------------------------------------*/
  useEffect(() => {
    const savedTheme = localStorage.getItem("iran_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("iran_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  /* -------------------------------------------------------
     🎬 3) Loading Screen (جلوگیری از Admin UI flash)
  ---------------------------------------------------------*/
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <img
            src={theme === "dark" ? "/logo-light.png" : "/logo-dark.png"}
            alt="IranConnect Logo"
            className="w-28 h-28 mx-auto mb-6 animate-pulse drop-shadow-lg"
          />

          <div className="text-2xl font-semibold tracking-wide mb-3">
            IranConnect Admin
          </div>

          <div className="text-sm opacity-70">
            Verifying session, please wait…
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent border-turquoise rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     ⛔ اگر مجاز نبود → هیچ UI نمایش نده
  ---------------------------------------------------------*/
  if (!authorized) return null;

  /* -------------------------------------------------------
     🟢 4) پنل ادمین
  ---------------------------------------------------------*/
  return (
    <SentryContextReady.Provider value={sentryReady}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex transition-colors">
        <Sidebar />
  
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar toggleTheme={toggleTheme} currentTheme={theme} />
  
          <main className="admin-main transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </SentryContextReady.Provider>
  );
