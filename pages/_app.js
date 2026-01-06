// frontend/pages/_app.js
import "../styles/globals_v3.css";
import "../styles/admin.css";
import "../styles/reactquill.css";
import "../styles/intro.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import GA4 from "../components/Analytics/GA4";

import CookieConsent from "../components/CookieConsent";
import AutoLogout from "../components/AutoLogout";
import apiClient from "../utils/apiClient";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const hasAnalyticsConsent =
    typeof window !== "undefined" &&
    localStorage.getItem("cookie_consent") === "accepted";


  const [theme, setTheme] = useState("light");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const isAuthPage = router.pathname.startsWith("/auth");


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

  /* 🔄 Session keep-alive (interval-based only) */
  useEffect(() => {
    if (!isLoggedIn) return;
  
    if (router.query.reason === "security") return;
  
    const interval = setInterval(() => {
      apiClient.get("/auth/ping").catch(() => {});
    }, 60000);
  
    return () => clearInterval(interval);
  }, [isLoggedIn, router.query.reason]);


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
      {hasAnalyticsConsent && (
        <GA4 measurementId={process.env.NEXT_PUBLIC_GA4_ID} />
      )}
    
      {needsCaptcha && (
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
      )}
    
      <CookieConsent />
    
      {!isAuthPage && <AutoLogout />}
    
      <Component
        {...pageProps}
        toggleTheme={toggleTheme}
        currentTheme={theme}
      />
      
      <Analytics />
    </>
  );
}
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV !== "production") return;

  navigator.sendBeacon(
    "/api/vitals",
    JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      label: metric.label,
      route: window.location.pathname,
    })
  );
}
