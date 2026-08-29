// pages/admin/consents.js
import {
  useEffect,
  useRef,
  useState,
} from "react";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";

import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function getChoiceClass(choice) {
  return choice === "accepted"
    ? "text-green-600"
    : "text-red-600";
}

export default function AdminConsentsPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const latestRequestIdRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { status: authStatus, role } = useAuthSession();

  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const [draftFilters, setDraftFilters] = useState({
    type: "",
    q: "",
    event_type: "",
    source: "",
  });

  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: [
      "tab",
      "type",
      "q",
      "event_type",
      "source",
    ],
    defaultLimit: 10,
  });

  const isSuperAdmin =
    role === "superadmin";

  const activeTab =
    filters.tab === "audit" &&
    isSuperAdmin
      ? "audit"
      : "current";

  /* ============================================================
     🔄 Sync URL filters → form state
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      type: filters.type || "",
      q: filters.q || "",
      event_type: filters.event_type || "",
      source: filters.source || "",
    });
  }, [
    isReady,
    filters.type,
    filters.q,
    filters.event_type,
    filters.source,
  ]);

  /* ============================================================
     📡 Fetch current tab data after URL/query changes
  ============================================================ */
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }

    fetchConsentData();
  }, [
    authChecked,
    isReady,
    activeTab,
    page,
    limit,
    filters.type,
    filters.q,
    filters.event_type,
    filters.source,
  ]);

  async function fetchConsentData() {
    const requestId =
      latestRequestIdRef.current + 1;
  
    latestRequestIdRef.current = requestId;
  
    setLoading(true);
    setError("");
  
    try {
      const endpoint =
        activeTab === "audit"
          ? "/admin/consents/audit-history"
          : "/admin/consents";
  
      const res = await apiClient.get(endpoint, {
        params: {
          page,
          limit,
          type: filters.type || undefined,
          q: filters.q || undefined,
  
          event_type:
            activeTab === "audit"
              ? filters.event_type || undefined
              : undefined,
  
          source:
            activeTab === "audit"
              ? filters.source || undefined
              : undefined,
        },
        withCredentials: true,
      });
  
      /*
        اگر در فاصله‌ی ارسال درخواست تا دریافت پاسخ،
        درخواست جدیدتری اجرا شده باشد، پاسخ قدیمی
        نباید UI را تغییر دهد.
      */
      if (
        requestId !== latestRequestIdRef.current
      ) {
        return;
      }
  
      setRows(res.data?.rows || []);
  
      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      if (
        requestId !== latestRequestIdRef.current
      ) {
        return;
      }
  
      console.error(
        "❌ Fetch consent data error:",
        err
      );
  
      setRows([]);
      setPagination(DEFAULT_PAGINATION);
  
      setError(
        err.response?.data?.error ||
          "Failed to load consent records."
      );
    } finally {
      if (
        requestId === latestRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  /* ============================================================
     🔍 Apply server-side filters
  ============================================================ */
  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      tab:
        activeTab === "audit"
          ? "audit"
          : "",

      type: draftFilters.type,
      q: draftFilters.q,

      event_type:
        activeTab === "audit"
          ? draftFilters.event_type
          : "",

      source:
        activeTab === "audit"
          ? draftFilters.source
          : "",
    });
  }

  /* ============================================================
     🧹 Clear current tab filters
  ============================================================ */
  async function handleClear() {
    setDraftFilters({
      type: "",
      q: "",
      event_type: "",
      source: "",
    });

    await clearFilters();

    if (activeTab === "audit") {
      await applyFilters({
        tab: "audit",
      });
    }
  }

  /* ============================================================
     🔁 Switch tab and reset audit-only filters when needed
  ============================================================ */
  async function handleTabChange(nextTab) {
    if (nextTab === activeTab) {
      return;
    }

    latestRequestIdRef.current += 1;

    setRows([]);
    setPagination(DEFAULT_PAGINATION);

    setDraftFilters((current) => ({
      ...current,
      event_type: "",
      source: "",
    }));

    await applyFilters({
      tab:
        nextTab === "audit"
          ? "audit"
          : "",

      type: draftFilters.type,
      q: draftFilters.q,
      event_type: "",
      source: "",
    });
  }

  /* ============================================================
     📤 Export filtered active tab
     SuperAdmin only
  ============================================================ */
  async function handleExport(format) {
    if (!isSuperAdmin) {
      return;
    }

    try {
      const res = await apiClient.get(
        `/admin/consents/export/${format}`,
        {
          params: {
            tab:
              activeTab === "audit"
                ? "audit"
                : "current",

            type: filters.type || undefined,
            q: filters.q || undefined,

            event_type:
              activeTab === "audit"
                ? filters.event_type || undefined
                : undefined,

            source:
              activeTab === "audit"
                ? filters.source || undefined
                : undefined,
          },

          withCredentials: true,
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data]);

      const url =
        window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      if (activeTab === "audit") {
        link.download =
          format === "xlsx"
            ? "IranConnect_Consent_Audit_History.xlsx"
            : "IranConnect_Consent_Audit_History.pdf";
      } else {
        link.download =
          format === "xlsx"
            ? "IranConnect_User_Consents.xlsx"
            : "IranConnect_User_Consents_Report.pdf";
      }

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "❌ Consent export failed:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to export consent data."
      );
    }
  }

  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Checking access...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="admin-title mb-5">
            🧾 User Consents
          </h2>

          {/* ==================================================
             Tabs
          ================================================== */}
          <div className="flex flex-wrap gap-3 mb-6 border-b border-[var(--border)] pb-4">
            <button
              type="button"
              onClick={() =>
                handleTabChange("current")
              }
              className={`admin-btn px-4 py-2 text-sm ${
                activeTab === "current"
                  ? "admin-btn-primary"
                  : "admin-btn-secondary"
              }`}
            >
              Current Consent State
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() =>
                  handleTabChange("audit")
                }
                className={`admin-btn px-4 py-2 text-sm ${
                  activeTab === "audit"
                    ? "admin-btn-primary"
                    : "admin-btn-secondary"
                }`}
              >
                Consent Audit History
              </button>
            )}
          </div>

          {/* ==================================================
             Filters
          ================================================== */}
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <select
              className="admin-input w-48"
              value={draftFilters.type}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
            >
              <option value="">
                All Consent Types
              </option>

              <option value="terms">
                Terms of Service
              </option>

              <option value="privacy">
                Privacy Policy
              </option>

              <option value="cookies">
                Cookies Policy
              </option>
            </select>

            <input
              type="text"
              placeholder="Search by user email..."
              className="admin-input w-60"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
            />

            {activeTab === "audit" && (
              <>
                <select
                  className="admin-input w-44"
                  value={
                    draftFilters.event_type
                  }
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      event_type:
                        event.target.value,
                    }))
                  }
                >
                  <option value="">
                    All Event Types
                  </option>

                  <option value="recorded">
                    Recorded
                  </option>

                  <option value="choice_changed">
                    Choice Changed
                  </option>

                  <option value="version_updated">
                    Version Updated
                  </option>

                  <option value="migrated">
                    Migrated
                  </option>
                </select>

                <select
                  className="admin-input w-52"
                  value={draftFilters.source}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      source: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    All Sources
                  </option>

                  <option value="registration_verify">
                    Registration Verify
                  </option>

                  <option value="terms_agreement">
                    Terms Agreement
                  </option>

                  <option value="anonymous_migration">
                    Anonymous Migration
                  </option>

                  <option value="legacy_consent_api">
                    Legacy Consent API
                  </option>
                </select>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary text-sm px-5 py-2 disabled:opacity-60"
            >
              Search
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={fetchConsentData}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
            >
              Refresh
            </button>

            {isSuperAdmin && (
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleExport("xlsx")
                  }
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  Export XLSX
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleExport("pdf")
                  }
                  className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  Export PDF
                </button>
              </div>
            )}
          </form>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <p className="admin-muted">
              Loading consent records...
            </p>
          ) : (
            <>
              {/* ==============================================
                 Current Consent State table
              ============================================== */}
              {activeTab === "current" && (
                <div className="overflow-x-auto">
                  <table className="admin-table w-full">
                    <thead>
                      <tr>
                        <th>User Email</th>
                        <th>Consent Type</th>
                        <th>Version</th>
                        <th>Choice</th>
                        {isSuperAdmin && (
                          <th>IP Address</th>
                        )}
                        <th>Updated At</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((consent) => (
                        <tr key={consent.id}>
                          <td>
                            {consent.email || "—"}
                          </td>

                          <td className="capitalize">
                            {consent.consent_type}
                          </td>

                          <td>
                            {consent.version || "—"}
                          </td>

                          <td
                            className={`font-semibold ${getChoiceClass(
                              consent.choice
                            )}`}
                          >
                            {consent.choice || "—"}
                          </td>

                          {isSuperAdmin && (
                            <td>
                              {consent.ip_address || "—"}
                            </td>
                          )}

                          <td>
                            {formatDateTime(
                              consent.updated_at
                            )}
                          </td>
                        </tr>
                      ))}

                      {!rows.length && (
                        <tr>
                          <td
                            colSpan={
                              isSuperAdmin ? 6 : 5
                            }
                            className="text-center opacity-70 p-4"
                          >
                            No consent records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ==============================================
                 Consent Audit History table
              ============================================== */}
              {activeTab === "audit" && (
                <div className="overflow-x-auto">
                  <table className="admin-table w-full">
                    <thead>
                      <tr>
                        <th>User Email</th>
                        <th>Consent Type</th>
                        <th>Version</th>
                        <th>Choice</th>
                        <th>Event Type</th>
                        <th>Source</th>
                        <th>Created At</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((event) => (
                        <tr key={event.id}>
                          <td>
                            {event.email || "—"}
                          </td>

                          <td className="capitalize">
                            {event.consent_type || "—"}
                          </td>

                          <td>
                            {event.policy_version || "—"}
                          </td>

                          <td
                            className={`font-semibold ${getChoiceClass(
                              event.choice
                            )}`}
                          >
                            {event.choice || "—"}
                          </td>

                          <td className="capitalize">
                            {String(
                              event.event_type || "—"
                            ).replace(/_/g, " ")}
                          </td>

                          <td className="capitalize">
                            {String(
                              event.source || "—"
                            ).replace(/_/g, " ")}
                          </td>

                          <td>
                            {formatDateTime(
                              event.created_at
                            )}
                          </td>
                        </tr>
                      ))}

                      {!rows.length && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center opacity-70 p-4"
                          >
                            No consent audit events found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!error && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={loading}
                />
              )}
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
