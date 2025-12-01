// frontend/pages/_app.js
import '../styles/globals_v2.css';
import '../styles/admin.css';
import '../styles/reactquill.css';
// ❌ loadingPage.css دیگر وجود ندارد

import { useEffect, useState, useRef } from 'react';
import CookieConsent from '../components/CookieConsent';
import AutoLogoutModal from '../components/AutoLogoutModal';
import apiClient from '../utils/apiClient';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inactive, setInactive] = useState(false);
  const timerRef = useRef(null);
  const router = useRouter();

  /* 🔐 تشخیص ورود کاربر از طریق کوکی HttpOnly */
  async function checkLoginByCookie() {
    try {
      const res = await apiClient.get('/auth/me', { withCredentials: true });
      setIsLoggedIn(!!res.data?.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }

  useEffect(() => {
    checkLoginByCookie();
  }, []);

  /* 🚀 Ping هنگام تغییر مسیر */
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleRouteChange = async () => {
      try {
        await apiClient.get('/auth/ping', { withCredentials: true });
      } catch {}
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [isLoggedIn]);

  /* 🎨 Load theme */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('iran_theme') || 'light';
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } catch {}
  }, []);

  /* 🕒 Auto Logout Timer */
  useEffect(() => {
    if (!isLoggedIn) {
      clearTimeout(timerRef.current);
      setInactive(false);
      return;
    }

    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setInactive(true), 2 * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isLoggedIn]);

  /* 🔄 Ping session validity */
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      apiClient.get('/auth/ping', { withCredentials: true }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  /* خروج امن */
  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout', {}, { withCredentials: true });
    } catch {}

    setIsLoggedIn(false);
    setInactive(false);
    router.replace('/auth/login');
  }

  /* ادامه حضور */
  function handleStay() {
    setInactive(false);
  }

  /* تغییر تم */
  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      localStorage.setItem('iran_theme', newTheme);
    } catch {}
    document.documentElement.setAttribute('data-theme', newTheme);
  }

  return (
    <>
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
