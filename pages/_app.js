// frontend/pages/_app.js
import "../styles/globals_v3.css";
import "../styles/admin.css";
import "../styles/reactquill.css";
import "../styles/intro.css";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Script from "next/script";

import CookieConsent from "../components/CookieConsent";
import AutoLogoutModal from "../components/AutoLogoutModal";
import apiClient from "../utils/apiClient";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const [theme, setTheme] = useState("light");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inactive, setInactive] = useState(false);

  const timerRef = useRef(null);

  /* 🔐 Check login via HttpOnly cookie */
  async function checkLoginByCookie() {
    try {
      const res = await apiClient.get("/auth/me", {
        withCredentials: true,
      });
      setIsLoggedIn(!!res.data?.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }

  /* Initial auth check */
  useEffect(() => {
    checkLoginByCookie();
  }, []);

  /* 🎨 Load theme safely (client only) */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedTheme = localStorage.getItem("iran_theme") || "light";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } catch {}
  }, []);

  /* 🕒 Auto logout (ONLY protected areas) */
  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setInactive(false);
      return;
    }

    useEffect(() => {
      if (!isLoggedIn) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setInactive(false);
        return;
      }
    
      const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setInactive(true);
        }, 2 * 60 * 1000);
      };
    
      const events = ["mousemove", "mousedown", "keypress", "touchstart"];
      events.forEach((e) => window.addEventListener(e, resetTimer));
    
      resetTimer();
    
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        events.forEach((e) => window.removeEventListener(e, resetTimer));
      };
    }, [isLoggedIn, router.pathname]);


    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setInactive(true);
      }, 2 * 60 * 1000); // 2 minutes
    };

    const events = ["mousemove", "mousedown", "keypress", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isLoggedIn, router.pathname]);

  /* 🔄 Session keep-alive (interval-based only) */
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      apiClient
        .get("/auth/ping", { withCredentials: true })
        .catch(() => {});
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  /* 🔐 Secure logout */
  async function handleLogout() {
    try {
      await apiClient.post(
        "/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch {}

    setIsLoggedIn(false);
    setInactive(false);
    router.replace("/auth/login");
  }

  function handleStay() {
    setInactive(false);
  }

  /* 🎨 Toggle theme */
  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("iran_theme", newTheme);
      } catch {}
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  }

  /* 🧩 Load reCAPTCHA ONLY when needed */
  const needsCaptcha =
    router.pathname.startsWith("/auth/login") ||
    router.pathname.startsWith("/auth/register") ||
    router.pathname.startsWith("/auth/forgot");

  return (
    <>
      {needsCaptcha && (
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
      )}

      <CookieConsent />

      {isLoggedIn && (
        <AutoLogoutModal
          visible={inactive}
          onStay={handleStay}
          onLogout={handleLogout}
        />
      )}

      <Component
        {...pageProps}
        toggleTheme={toggleTheme}
        currentTheme={theme}
      />
    </>
  );
}
