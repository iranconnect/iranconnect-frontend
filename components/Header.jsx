// frontend/components/Header.jsx
'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ProfileMenu from './ProfileMenu';
import apiClient from '../utils/apiClient.js';
import { logoutAndRedirect } from '../utils/logoutAndRedirect';
import { useAuthSession } from '../hooks/useAuthSession';
import {
  Search,
  Menu,
  X,
  User,
  ChevronRight,
  Mail,
  Info,
  LogIn,
  History,
  Building2,
  LockKeyhole,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/router';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const router = useRouter();
  const [hasBusiness, setHasBusiness] = useState(false);

  const { status, role, user } = useAuthSession();

  const isLoggedIn = status === "authenticated";
  const isAdmin = role === "admin" || role === "superadmin";
  const email = user?.email || "";
  const hasRequests = !!user?.hasRequests;

  /* PLR-14: Mobile navigation interaction */
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleNavigation = () => {
      setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    router.events.on("routeChangeStart", handleNavigation);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      router.events.off("routeChangeStart", handleNavigation);
    };
  }, [menuOpen, router.events]);

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
    <header ref={headerRef} className="site-header shadow-sm border-b border-[var(--border)] bg-[var(--bg)] transition">
      <div className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-between py-3 px-4 md:px-2 gap-3">

        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
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
          {isLoggedIn && (
            <Link
              href="/search"
              prefetch={false}
              aria-label="Search"
              title="Search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition"
            >
              <Search size={24} strokeWidth={2} aria-hidden="true" />
            </Link>
          )}

          {status === "unauthenticated" && (
            <Link
              href="/contact"
              className="text-sm text-[var(--text)] hover:text-turquoise transition"
            >
              Contact
            </Link>
          )}

          <Link
            href="/about"
            className="text-sm text-[var(--text)] hover:text-turquoise transition"
          >
            About
          </Link>

          {status === "unauthenticated" && (
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

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-sm rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {isLoggedIn && (
            <Link
              href="/search"
              prefetch={false}
              aria-label="Search"
              title="Search"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition"
            >
              <Search size={24} strokeWidth={2} aria-hidden="true" />
            </Link>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition"
          >
            {menuOpen ? (
              <X size={28} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Menu size={28} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* PLR-14: Animated mobile navigation */}
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        ref={(node) => {
          node?.toggleAttribute("inert", !menuOpen);
        }}
        className={`grid md:hidden transition-[grid-template-rows,opacity] duration-[250ms] ease-in-out motion-reduce:transition-none ${
          menuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="bg-[var(--bg)] border-t border-[var(--border)] flex flex-col px-5 py-3 shadow-md">
            {isLoggedIn && (
              <Link
                href="/account"
                prefetch={false}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[56px] items-center gap-3 rounded-lg px-1 py-2 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <User
                  size={24}
                  className="shrink-0 text-turquoise"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    My Account
                  </div>
                  {email && (
                    <div className="truncate text-xs text-turquoise">
                      {email}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={18}
                  className="shrink-0"
                  aria-hidden="true"
                />
              </Link>
            )}

            {isLoggedIn && (
              <div className="my-1 border-t border-[var(--border)]" />
            )}

            {status === "unauthenticated" && (
              <Link
                href="/contact"
                prefetch={false}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
              >
                <Mail size={18} aria-hidden="true" />
                <span>Contact</span>
              </Link>
            )}

            <Link
              href="/about"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
            >
              <Info size={18} aria-hidden="true" />
              <span>About</span>
            </Link>

            {status === "unauthenticated" && (
              <Link
                href="/auth/login"
                prefetch={false}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
              >
                <LogIn size={18} aria-hidden="true" />
                <span>Login</span>
              </Link>
            )}

            {isLoggedIn && (
              <>
                {hasRequests && (
                  <Link
                    href="/account/requests"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
                  >
                    <History size={18} aria-hidden="true" />
                    <span>Requests / History</span>
                  </Link>
                )}

                {hasBusiness && (
                  <Link
                    href="/account/businesses"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 font-medium text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
                  >
                    <Building2 size={18} aria-hidden="true" />
                    <span>Business Management</span>
                  </Link>
                )}

                <div className="my-1 border-t border-[var(--border)]" />

                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
                  >
                    <LayoutDashboard size={18} aria-hidden="true" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link
                  href="/account/change-password"
                  prefetch={false}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-[var(--text)] hover:text-turquoise focus-visible:outline focus-visible:outline-2"
                >
                  <LockKeyhole size={18} aria-hidden="true" />
                  <span>Change Password</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg px-1 text-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2"
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
