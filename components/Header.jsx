// frontend/components/Header.jsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProfileMenu from './ProfileMenu';
import apiClient from '../utils/apiClient.js';
import { logoutAndRedirect } from '../utils/logoutAndRedirect';
import { useAuthSession } from '../hooks/useAuthSession';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);

  const { status, role, user } = useAuthSession();

  const isLoggedIn = status === "authenticated";
  const isAdmin = role === "admin" || role === "superadmin";
  const email = user?.email || "";
  const hasRequests = !!user?.hasRequests;

  /* 🧩 Load ownership metadata only after authentication */
  useEffect(() => {
    let mounted = true;

    async function loadOwnership() {
      if (!isLoggedIn) {
        setHasBusiness(false);
        return;
      }

      try {
        const ownership = await apiClient.get(
          "/users/me/ownership",
          {
            withCredentials: true,
            requireAuth: true,
          }
        );

        if (!mounted) return;

        if (ownership.status === 200) {
          setHasBusiness(
            !!ownership.data?.has_verified_business
          );
          return;
        }

        setHasBusiness(false);
      } catch {
        if (!mounted) return;

        setHasBusiness(false);
      }
    }

    loadOwnership();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  /* 🎨 Observe theme changes */
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("iran_theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "light";

    document.documentElement.setAttribute(
      "data-theme",
      savedTheme
    );

    setTheme(savedTheme);

    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.getAttribute("data-theme")
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* 🌗 تغییر تم */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('iran_theme', newTheme); // این یکی باید بماند
    setTheme(newTheme);
  };

  /* 🚪 خروج */
  const handleLogout = async () => {
    await logoutAndRedirect();
  };
  return (
    <header className="site-header shadow-sm border-b border-[var(--border)] bg-[var(--bg)] transition">
      <div className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-between py-3 px-4 md:px-2 gap-3">

        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-turquoise text-xl md:text-2xl flex items-center gap-3"
        >
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="IranConnect"
            className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg transition-all duration-300"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-5 items-center">
          <Link
            href="/search"
            className="text-sm text-[var(--text)] hover:text-turquoise transition"
          >
            Search
          </Link>

          <Link
            href="/contact"
            className="text-sm text-[var(--text)] hover:text-turquoise transition"
          >
            Contact
          </Link>

          <Link
            href="/about"
            className="text-sm text-[var(--text)] hover:text-turquoise transition"
          >
            About
          </Link>

          {!isLoggedIn && (
            <Link
              href="/auth/login"
              className="text-sm text-[var(--text)] hover:text-turquoise transition"
            >
              Login
            </Link>
          )}

          {/* Profile */}
          {isLoggedIn && (
            <ProfileMenu
              role={role}
              email={user?.email || ""}
              hasRequests={hasRequests}
              hasBusiness={hasBusiness}
            />
          )}

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)] hover:scale-[1.03] transition"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </nav>

        {/* Mobile Nav Icon */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] hover:scale-[1.03] transition"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[var(--text)] focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  menuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* === Mobile dropdown menu === */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--bg)] border-t border-[var(--border)] flex flex-col px-6 py-4 space-y-3 shadow-md">
          
          {/* Email above menu */}
          {isLoggedIn && email && (
            <div className="pb-2 border-b border-[var(--border)] mb-2">
              <p className="text-sm font-medium text-turquoise truncate">{email}</p>
            </div>
          )}

          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            className="text-[var(--text)] hover:text-turquoise"
          >
            Search
          </Link>

          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="text-[var(--text)] hover:text-turquoise"
          >
            Contact
          </Link>

          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-[var(--text)] hover:text-turquoise"
          >
            About
          </Link>

          {!isLoggedIn && (
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="text-[var(--text)] hover:text-turquoise"
            >
              Login
            </Link>
          )}

          {isLoggedIn && (
            <>
              {/* Requests */}
              {hasRequests && (
                <Link
                  href="/account/requests"
                  onClick={() => setMenuOpen(false)}
                  className="text-[var(--text)] hover:text-turquoise"
                >
                  Requests / History
                </Link>
              )}
              
              {/* Business Management */}
              {hasBusiness && (
                <>
                  <div className="border-t border-[var(--border)] my-2"></div>
              
                  <Link
                    href="/account/businesses"
                    onClick={() => setMenuOpen(false)}
                    className="font-medium text-[var(--text)] hover:text-turquoise"
                  >
                    🏢 Business Management
                  </Link>
                </>
              )}

              <div className="border-t border-[var(--border)] my-2"></div>

              {/* Admin */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-[var(--text)] hover:text-turquoise"
                >
                  Admin Dashboard
                </Link>
              )}

              <Link
                href="/account/change-password"
                onClick={() => setMenuOpen(false)}
                className="text-[var(--text)] hover:text-turquoise"
              >
                Change Password
              </Link>

              <button
                onClick={handleLogout}
                className="text-left text-red-500 hover:text-turquoise"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
