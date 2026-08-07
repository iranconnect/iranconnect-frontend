// frontend/components/admin/Sidebar.jsx

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import apiClient from "../../utils/apiClient.js";

const groupedNav = [
  {
    label: "Overview",
    icon: "🏠",
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Businesses",
    icon: "🏢",
    items: [
      { href: "/admin/businesses", label: "All Businesses" },
      { href: "/admin/add-v2", label: "Add Business" },
      { href: "/admin/claims", label: "Claim Requests" },
      { href: "/admin/requests", label: "Requests" },
    ],
  },
  {
    label: "Catalog",
    icon: "🗂️",
    items: [
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/subcategories", label: "Subcategories" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/tags", label: "Tags" },
    ],
  },
  {
    label: "Users",
    icon: "👥",
    items: [
      { href: "/admin/users", label: "Manage Users" },
      { href: "/admin/consents", label: "User Consents" },
      { href: "/admin/contact-requests", label: "Contact Requests" },
    ],
  },
  {
    label: "Policies & Emails",
    icon: "📜",
    items: [
      { href: "/admin/policies", label: "Policies" },
      { href: "/admin/bulk-email", label: "Bulk Email" },
    ],
  },
  {
    label: "Security",
    icon: "🛡️",
    allowedRoles: ["superadmin"],
    items: [
      { href: "/admin/security-logs", label: "Forgot Password Logs" },
      { href: "/admin/file-logs", label: "File uploaded Logs" },
      { href: "/admin/login-attempts", label: "Login Logs" },
      {
        label: "Suspicious IPs",
        href: "/admin/suspicious-ips",
        children: [
          { href: "/admin/blocked-ips", label: "Blocked IPs" },
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: "⚙️",
    items: [{ href: "/admin/settings", label: "System Settings" }],
  },
];

export default function Sidebar({ role }) {
  const router = useRouter();
  const { pathname } = router;

  const [theme, setTheme] = useState("light");
  const [openGroup, setOpenGroup] = useState(null);
  const [openSubGroup, setOpenSubGroup] = useState(null);

  const [unblockedCount, setUnblockedCount] = useState(0);

  // ✅ کلید per-admin (per-browser-tab/session) برای اینکه بعد از دیدن صفحه suspicious پاک بشه
  const SEEN_KEY = "iranconnect_seen_suspicious_ips";

  /* --------------------------------------------------------
     🔍 Fetch suspicious IP count using HttpOnly session
     ✅ فقط اگر کاربر هنوز صفحه suspicious-ips رو ندیده باشد
  ---------------------------------------------------------*/
  useEffect(() => {
    if (role !== "superadmin") {
      setUnblockedCount(0);
      return;
    }
  
    const alreadySeen =
      sessionStorage.getItem(SEEN_KEY) === "true";
  
    if (!alreadySeen) {
      fetchSuspiciousCount();
    }
  }, [role]);

  /* --------------------------------------------------------
     ✅ وقتی وارد صفحه suspicious-ips شدیم:
     - badge برای همین ادمین (همین session) پاک شود
     - و دیگر در این session نمایش داده نشود
  ---------------------------------------------------------*/
  useEffect(() => {
    if (pathname.startsWith("/admin/suspicious-ips")) {
      sessionStorage.setItem(SEEN_KEY, "true");
      setUnblockedCount(0);
    }
  }, [pathname]);

  async function fetchSuspiciousCount() {
    try {
      const res = await apiClient.get(
        "/admin/suspicious-ips/count-unblocked",
        { withCredentials: true }
      );

      const count = res.data?.count || 0;
      setUnblockedCount(count);
    } catch (err) {
      const status = err.response?.status;
    
      /*
       * Authentication/session failures are handled centrally
       * by apiClient. Do not redirect here, otherwise a security
       * redirect such as ?reason=security could be overwritten.
       */
      if (status === 401 || status === 440) {
        setUnblockedCount(0);
        return;
      }
    
      /*
       * Permission failure is not a login failure.
       * Hide the privileged badge and keep the page usable.
       */
      if (status === 403) {
        setUnblockedCount(0);
        return;
      }
    
      console.warn(
        "Failed to fetch suspicious IP count:",
        err
      );
    
      setUnblockedCount(0);
    }
  }

  /* --------------------------------------------------------
     🎨 Sync Theme with DOM
  ---------------------------------------------------------*/
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleGroup = (label) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  const visibleGroups = groupedNav.filter((group) => {
    if (!group.allowedRoles) {
      return true;
    }
  
    return group.allowedRoles.includes(role);
  });

  return (
    <aside
      className="
        hidden md:flex md:flex-col w-60 min-h-screen
        sticky top-0 self-start
        bg-[var(--card-bg)] border-r border-[var(--border)]
        text-[var(--text)] shadow-[4px_0_12px_var(--shadow-dark)]
        transition
      "
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-[var(--border)] flex items-center gap-4">
        {/* Logo links to the public Home page */}
        <Link href="/" className="shrink-0">
          <img
            src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
            alt="IranConnect Logo"
            className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg transition-all duration-300 cursor-pointer"
          />
        </Link>

        <div className="font-semibold text-[var(--color-text)] text-xl md:text-2xl tracking-wide">
          Admin
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <button
              onClick={() => toggleGroup(group.label)}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                openGroup === group.label
                  ? "bg-turquoise/20 text-turquoise shadow-inner"
                  : "text-[var(--text)] hover:bg-turquoise/10 hover:text-turquoise"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{group.icon}</span>
                <span>{group.label}</span>

                {/* ✅ badge فقط اگر هنوز صفحه suspicious دیده نشده باشد */}
                {group.label === "Security" &&
                  openGroup !== "Security" &&
                  unblockedCount > 0 &&
                  !pathname.startsWith("/admin/suspicious-ips") && (
                    <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                      {unblockedCount}
                    </span>
                  )}
              </span>

              <span className="text-xs">
                {openGroup === group.label ? "▲" : "▼"}
              </span>
            </button>

            {openGroup === group.label && (
              <div className="ml-6 mt-2 border-l border-[var(--border)] pl-2">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const isSuspiciousGroup =
                    item.href === "/admin/suspicious-ips";

                  if (item.children) {
                    const isOpen = openSubGroup === item.label;

                    return (
                      <div key={item.href} className="mb-1">
                        <div
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                            isOpen || active
                              ? "bg-turquoise/30 text-turquoise"
                              : "text-[var(--text)] hover:bg-turquoise/10 hover:text-turquoise"
                          }`}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center gap-2 flex-1"
                          >
                            <span>{item.label}</span>

                            {/* ✅ badge داخل خود Suspicious IPs فقط اگر هنوز دیده نشده */}
                            {item.href === "/admin/suspicious-ips" &&
                              unblockedCount > 0 &&
                              !pathname.startsWith("/admin/suspicious-ips") && (
                                <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                                  {unblockedCount}
                                </span>
                              )}
                          </Link>

                          <button
                            onClick={() =>
                              setOpenSubGroup(isOpen ? null : item.label)
                            }
                            className="text-xs px-2 py-1"
                            type="button"
                          >
                            {isOpen ? "▲" : "▼"}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="ml-4 mt-1 border-l border-[var(--border)] pl-2">
                            {item.children.map((child) => {
                              const childActive = pathname.startsWith(
                                child.href
                              );
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`block px-2 py-1.5 rounded-md text-sm mb-1 transition-all ${
                                    childActive
                                      ? "bg-turquoise/30 text-turquoise"
                                      : "text-[var(--text)] hover:bg-turquoise/10 hover:text-turquoise"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-2 py-1.5 rounded-md text-sm mb-1 transition-all ${
                        active
                          ? "bg-turquoise/30 text-turquoise"
                          : "text-[var(--text)] hover:bg-turquoise/10 hover:text-turquoise"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{item.label}</span>

                        {/* ✅ badge کنار آیتم اصلی Suspicious IPs */}
                        {isSuspiciousGroup &&
                          unblockedCount > 0 &&
                          !pathname.startsWith("/admin/suspicious-ips") && (
                            <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                              {unblockedCount}
                            </span>
                          )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 text-xs text-[var(--text)]/70 border-t border-[var(--border)]">
        IranConnect v1.0
      </div>
    </aside>
  );
}
