// frontend/components/ProfileMenu.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  User,
  ChevronRight,
  History,
  Building2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
} from 'lucide-react';

import { logoutAndRedirect } from '../utils/logoutAndRedirect';

export default function ProfileMenu({
  role,
  email,
  hasRequests,
  hasBusiness,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const router = useRouter();

  const isAdmin =
    role === 'admin' || role === 'superadmin';

  const closeMenu = () => setMenuOpen(false);

  /* PLR-14: Consistent desktop menu interaction */
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleNavigation = () => {
      setMenuOpen(false);
    };

    document.addEventListener(
      'pointerdown',
      handleOutside
    );

    document.addEventListener(
      'keydown',
      handleEscape
    );

    router.events.on(
      'routeChangeStart',
      handleNavigation
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutside
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );

      router.events.off(
        'routeChangeStart',
        handleNavigation
      );
    };
  }, [menuOpen, router.events]);

  const logout = async () => {
    await logoutAndRedirect();
  };

  const rowClass =
    'flex min-h-[44px] items-center gap-3 rounded-lg px-2 text-sm text-[var(--text)] hover:text-turquoise hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors';

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-label="Profile menu"
        aria-expanded={menuOpen}
        aria-controls="desktop-profile-navigation"
        className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--card-bg)] shadow-[4px_4px_8px_var(--shadow-dark),-4px_-4px_8px_var(--shadow-light)] hover:scale-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition"
      >
        <User
          size={18}
          className="text-turquoise"
          aria-hidden="true"
        />
      </button>

      {/* PLR-14: Animated desktop profile navigation */}
      <nav
        id="desktop-profile-navigation"
        aria-label="Account navigation"
        aria-hidden={!menuOpen}
        ref={(node) => {
          node?.toggleAttribute('inert', !menuOpen);
        }}
        className={`absolute right-0 top-full mt-3 w-72 z-50 transition-[transform,opacity,visibility] duration-[250ms] ease-in-out motion-reduce:transition-none ${
          menuOpen
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-2 opacity-0 pointer-events-none'
        }`}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)] p-3">

          <Link
            href="/account"
            prefetch={false}
            onClick={closeMenu}
            className="flex min-h-[56px] items-center gap-3 rounded-lg px-2 py-2 text-[var(--text)] hover:text-turquoise hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
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

          <div className="my-1 border-t border-[var(--border)]" />

          {hasRequests && (
            <Link
              href="/account/requests"
              prefetch={false}
              onClick={closeMenu}
              className={rowClass}
            >
              <History size={18} aria-hidden="true" />
              <span>Requests / History</span>
            </Link>
          )}

          {hasBusiness && (
            <Link
              href="/account/businesses"
              prefetch={false}
              onClick={closeMenu}
              className={`${rowClass} font-medium`}
            >
              <Building2 size={18} aria-hidden="true" />
              <span>Business Management</span>
            </Link>
          )}

          {(hasRequests || hasBusiness) && (
            <div className="my-1 border-t border-[var(--border)]" />
          )}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              prefetch={false}
              onClick={closeMenu}
              className={rowClass}
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <Link
            href="/account/change-password"
            prefetch={false}
            onClick={closeMenu}
            className={rowClass}
          >
            <LockKeyhole size={18} aria-hidden="true" />
            <span>Change Password</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-2 text-sm text-red-500 hover:text-red-600 hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 transition-colors"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
