// frontend/pages/admin/policies.js
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";
import AdminRichTextEditor from "../../components/admin/AdminRichTextEditor";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";
import DOMPurify from "isomorphic-dompurify";

const POLICY_FILTER_KEYS = [
  "type",
  "lang",
  "status",
  "version",
  "created_by",
  "date_from",
  "date_to",
];

const EMPTY_POLICY_FILTER_FORM = {
  type: "",
  lang: "",
  status: "",
  version: "",
  created_by: "",
  date_from: "",
  date_to: "",
};

function getApiErrorMessage(
  error,
  fallbackMessage
) {
  const responseData =
    error?.response?.data;

  const firstDetail =
    Array.isArray(
      responseData?.details
    )
      ? responseData.details[0]
      : null;

  return (
    firstDetail?.message ||
    responseData?.error ||
    fallbackMessage
  );
}

export default function PoliciesAdmin() {
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
    clearFilters,
  } = usePaginationQuery({
    filterKeys: POLICY_FILTER_KEYS,
    defaultLimit: 10,
  });

  const [policies, setPolicies] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filterForm, setFilterForm] = useState(
    EMPTY_POLICY_FILTER_FORM
  );
  
  const [filterSubmitting, setFilterSubmitting] =
    useState(false);

  const [type, setType] = useState("privacy");
  const [lang, setLang] = useState("en");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState("");
  const [changeNote, setChangeNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState("light");
  const { status: authStatus, role } = useAuthSession();

  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const [historyKey, setHistoryKey] = useState({
    type: "privacy",
    lang: "en",
  });

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState(null);

  const canManagePolicies =
    role === "superadmin";

  /* ============================================================
     🎨 Theme sync (safe MutationObserver)
  ============================================================ */
  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.getAttribute("data-theme") || "light"
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);
  /* ============================================================
     📄 Fetch policies (admin only)
  ============================================================ */
  const fetchPolicies = useCallback(
    async ({
      requestedPage = page,
      requestedLimit = limit,
    } = {}) => {
      if (!authChecked || !isReady) {
        return;
      }

      try {
        setListLoading(true);
        setError("");

        const params = {
          page: requestedPage,
          limit: requestedLimit,
        };

        for (const [
          key,
          value,
        ] of Object.entries(filters)) {
          const normalized = String(
            value || ""
          ).trim();

          if (normalized) {
            params[key] = normalized;
          }
        }

        const res = await apiClient.get(
        "/policies/admin",
          {
            params,
            withCredentials: true,
          }
        );

        setPolicies(
          Array.isArray(res.data?.items)
            ? res.data.items
            : []
        );

        setPagination(
          res.data?.pagination || null
        );
      } catch (err) {
        console.error(
          "❌ Fetch policies error:",
          err
        );

        setPolicies([]);
        setPagination(null);

        setError(
          getApiErrorMessage(
            err,
            "Failed to load policies."
          )
        );
      } finally {
        setListLoading(false);
      }
    },
    [
      authChecked,
      isReady,
      page,
      limit,
      filters,
    ]
  );

  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }

    fetchPolicies();
  }, [
    authChecked,
    isReady,
    fetchPolicies,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    setFilterForm({
      type: filters.type || "",
      lang: filters.lang || "",
      status: filters.status || "",
      version: filters.version || "",
      created_by: filters.created_by || "",
      date_from: filters.date_from || "",
      date_to: filters.date_to || "",
    });
  }, [
    isReady,
    filters.type,
    filters.lang,
    filters.status,
    filters.version,
    filters.created_by,
    filters.date_from,
    filters.date_to,
  ]);

  function updateFilterField(event) {
    const { name, value } = event.target;
  
    setFilterForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function searchPolicies(event) {
    event.preventDefault();
  
    const dateFrom =
      filterForm.date_from;
  
    const dateTo =
      filterForm.date_to;
  
    /*
      HTML date inputs return ISO values:
      YYYY-MM-DD
  
      ISO date strings can safely be compared
      lexicographically.
    */
    if (
      dateFrom &&
      dateTo &&
      dateFrom > dateTo
    ) {
      setError(
        '"Date from" cannot be later than "Date to".'
      );
  
      return;
    }
  
    try {
      setFilterSubmitting(true);
      setError("");
  
      await applyFilters(
        filterForm
      );
    } catch (err) {
      console.error(
        "❌ Apply policy filters error:",
        err
      );
  
      setError(
        getApiErrorMessage(
          err,
          "Failed to apply policy filters."
        )
      );
    } finally {
      setFilterSubmitting(false);
    }
  }

  async function resetPolicyFilters() {
    try {
      setFilterSubmitting(true);
      setError("");
  
      setFilterForm(
        EMPTY_POLICY_FILTER_FORM
      );
  
      await clearFilters();
    } catch (err) {
      console.error(
        "❌ Clear policy filters error:",
        err
      );
  
      setError(
        "Failed to clear policy filters."
      );
    } finally {
      setFilterSubmitting(false);
    }
  }

  /* ============================================================
     💾 Create / Update policy (XSS-safe)
  ============================================================ */
  async function savePolicy() {
    if (!canManagePolicies) {
      setError(
        "Only a SuperAdmin can publish policy changes."
      );
      return;
    }

    if (
      !content ||
      content.trim().length < 10
    ) {
      setError(
        "Policy content is too short."
      );
      return;
    }

    /*
      Temporary fallback until the change-note input
      is added in Phase B.
    */
    const resolvedChangeNote =
      changeNote.trim() ||
      window.prompt(
        editingId
          ? "Please enter the reason for this policy revision:"
          : "Please enter a note describing this policy publication:"
      )?.trim();

    if (!resolvedChangeNote) {
      setError(
        "A change note is required."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const sanitized =
        type === "cookie_banner"
          ? content.trim()
          : DOMPurify.sanitize(content, {
              USE_PROFILES: {
                html: true,
              },
            });

      if (editingId) {
        await apiClient.post(
          `/policies/admin/${editingId}/revise`,
          {
            content: sanitized,
            change_note:
              resolvedChangeNote,
          },
          {
            withCredentials: true,
          }
        );
      } else {
        await apiClient.post(
        "/policies/admin",
          {
            type,
            lang,
            content: sanitized,
            change_note:
              resolvedChangeNote,
          },
          {
            withCredentials: true,
          }
        );
      }

      alert(
        editingId
          ? "✅ A new policy version was published."
          : "✅ Policy published successfully."
      );

      resetForm();
      await fetchPolicies();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "❌ Save policy error:",
          err
        );
      }

      setError(
        err.response?.data?.error ||
          "Error publishing policy."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     ✏️ Edit policy
  ============================================================ */
  async function editPolicy(policyId) {
    if (!canManagePolicies) {
      return;
    }

    try {
      setDetailsLoading(true);
      setError("");

      const res = await apiClient.get(
        `/policies/admin/${policyId}`,
        {
          withCredentials: true,
        }
      );

      const policy =
        res.data?.item;

      if (!policy) {
        throw new Error(
          "Policy details were not returned."
        );
      }

      if (
        policy.status !== "published"
      ) {
        setError(
          "Only the current published policy can be revised. Use Restore for a historical version."
        );
        return;
      }

      setEditingId(policy.id);
      setType(policy.type);
      setLang(policy.lang);
      setContent(policy.content || "");
      setPreview(policy.content || "");
      setChangeNote("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "❌ Load policy details error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to load policy details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setType("privacy");
    setLang("en");
    setContent("");
    setPreview("");
    setChangeNote("");
    setError("");
  }

  /* ============================================================
     🕓 Load policy history
  ============================================================ */
  async function openHistory(
    targetType = type,
    targetLang = lang,
    requestedPage = 1
  ) {
    try {
      setHistoryLoading(true);
      setHistoryKey({
        type: targetType,
        lang: targetLang,
      });

      const res = await apiClient.get(
        `/policies/admin/history/${targetType}/${targetLang}`,
        {
          params: {
            page: requestedPage,
            limit: 5,
          },
          withCredentials: true,
        }
      );

      setHistoryList(
        Array.isArray(res.data?.items)
          ? res.data.items
          : []
      );

      setHistoryPagination(
        res.data?.pagination || null
      );

      setHistoryOpen(true);
    } catch (err) {
      console.error(
        "❌ Load policy history error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Error loading history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function changeHistoryPage(
    nextPage
  ) {
    await openHistory(
      historyKey.type,
      historyKey.lang,
      nextPage
    );
  }

  /* ============================================================
     🔁 Restore previous version (as new)
  ============================================================ */
  async function restoreVersion(id) {
    if (!canManagePolicies) {
      return;
    }

    const restoreReason =
      window.prompt(
        "Please explain why this historical version should be restored:"
      )?.trim();

    if (!restoreReason) {
      return;
    }

    if (
      !confirm(
        "Restore this historical content as a new published version?"
      )
    ) {
      return;
    }

    try {
      await apiClient.post(
        `/policies/admin/${id}/restore`,
        {
          change_note:
            restoreReason,
        },
        {
          withCredentials: true,
        }
      );

      await fetchPolicies();

      await openHistory(
        historyKey.type,
        historyKey.lang,
        1
      );

      alert(
        "✅ Historical content was restored as a new published version."
      );
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "❌ Restore policy error:",
          err
        );
      }

      alert(
        err.response?.data?.error ||
          "Error restoring policy version."
      );
    }
  }

  /* ============================================================
     🎨 Theme-based styles
  ============================================================ */
  const textColor = theme === "dark" ? "#ffffff" : "#0a1a44";
  const cardBg = theme === "dark" ? "#0f172a" : "var(--card-bg)";
  const borderColor = theme === "dark" ? "#334155" : "var(--border)";
  const inputBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const subtleText = theme === "dark" ? "#cbd5e1" : "#475569";

  /* ============================================================
     ⛔ Block render until auth confirmed
  ============================================================ */
  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Checking access…
        </div>
      </AdminLayout>
    );
  }
  /* ============================================================
     🎨 UI
  ============================================================ */
  return (
    <AdminLayout>
      <div className="p-6" style={{ color: textColor }}>
        {/* ===== Header ===== */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">
            🧾 Policy Manager
          </h1>
        
          {canManagePolicies && (
            <button
              type="button"
              onClick={() =>
                openHistory(type, lang)
              }
              className="px-3 py-2 rounded-md border"
              style={{
                backgroundColor: inputBg,
                borderColor,
                color: textColor,
              }}
            >
              🕓 View History ({type} / {lang})
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
            {error}
          </p>
        )}

        {/* ===== Create / Edit Form ===== */}
        {canManagePolicies ? (
          <div
            className="relative z-0 p-6 rounded-2xl shadow-md mb-8 border"
            style={{
              backgroundColor: cardBg,
              borderColor,
              isolation: "isolate",
            }}
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label
                  className="block text-sm mb-1"
                  style={{ color: subtleText }}
                >
                  Policy Type
                </label>
        
                <select
                  value={type}
                  disabled={Boolean(editingId)}
                  onChange={(e) => {
                    setType(e.target.value);
                    setContent("");
                    setPreview("");
                  }}
                  className="border p-2 rounded-md w-full disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    color: textColor,
                    backgroundColor: inputBg,
                    borderColor,
                  }}
                >
                  <option value="privacy">
                    Privacy
                  </option>
        
                  <option value="terms">
                    Terms
                  </option>
        
                  <option value="cookies">
                    Cookies
                  </option>
        
                  <option value="cookie_banner">
                    Cookie Banner
                  </option>
                </select>
              </div>
        
              <div className="flex-1">
                <label
                  className="block text-sm mb-1"
                  style={{ color: subtleText }}
                >
                  Language
                </label>
        
                <select
                  value={lang}
                  disabled={Boolean(editingId)}
                  onChange={(e) =>
                    setLang(e.target.value)
                  }
                  className="border p-2 rounded-md w-full disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    color: textColor,
                    backgroundColor: inputBg,
                    borderColor,
                  }}
                >
                  <option value="en">
                    English
                  </option>
        
                  <option value="fr">
                    Français
                  </option>
        
                  <option value="fa">
                    فارسی
                  </option>
                </select>
              </div>
            </div>
        
            {/* ===== Editor / Preview ===== */}
            {type !== "cookie_banner" ? (
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    {editingId
                      ? "✏️ Revise Published Policy"
                      : "➕ New Policy"}
                  </h3>
        
                  <AdminRichTextEditor
                    value={content}
                    onChange={(value) => {
                      setContent(value);
                      setPreview(value);
                    }}
                    placeholder="Write the policy content..."
                    minHeight={250}
                    enableImages
                  />
                </div>
        
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    👁️ Live Preview
                  </h3>
        
                  <div
                    className="border rounded-md p-3 min-h-[200px] prose prose-sm max-w-none"
                    style={{
                      color: textColor,
                      backgroundColor: inputBg,
                      borderColor,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        preview
                      ),
                    }}
                  />
                </div>
              </div>
            ) : (
              <textarea
                className="w-full min-h-[180px] border p-3 rounded-md mt-4"
                placeholder='{"title":"We use cookies 🍪"}'
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                style={{
                  color: textColor,
                  backgroundColor: inputBg,
                  borderColor,
                }}
              />
            )}
        
            {/* ===== Change Note ===== */}
            <div className="mt-4">
              <label
                className="block text-sm mb-1"
                style={{ color: subtleText }}
              >
                Change Note
              </label>
        
              <textarea
                value={changeNote}
                onChange={(e) =>
                  setChangeNote(e.target.value)
                }
                rows={3}
                maxLength={1000}
                placeholder={
                  editingId
                    ? "Explain what changed in this revision."
                    : "Explain why this policy is being published."
                }
                className="w-full border p-3 rounded-md"
                style={{
                  color: textColor,
                  backgroundColor: inputBg,
                  borderColor,
                }}
              />
        
              <p
                className="mt-1 text-xs"
                style={{ color: subtleText }}
              >
                {changeNote.length}/1000
              </p>
            </div>
        
            {/* ===== Buttons ===== */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={savePolicy}
                disabled={
                  loading ||
                  detailsLoading
                }
                className="px-4 py-2 bg-turquoise text-white rounded-md hover:bg-turquoise/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "💾 Publish New Version"
                  : "Add Policy"}
              </button>
        
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="mb-8 rounded-xl border p-4 text-sm"
            style={{
              backgroundColor: cardBg,
              borderColor,
              color: subtleText,
            }}
          >
            Policy management is read-only for Admin accounts.
            Only a SuperAdmin can publish, revise, or restore policy versions.
          </div>
        )}
        
        {/* ===== Policies Table ===== */}
        <div
          className="p-6 rounded-2xl shadow-md border"
          style={{
            backgroundColor: cardBg,
            borderColor,
          }}
        >
          <h2 className="text-lg font-semibold mb-3">
            📋 Existing Policies
          </h2>

          <form
            onSubmit={searchPolicies}
            className="mb-5 rounded-xl border p-4"
            style={{
              borderColor,
              backgroundColor: inputBg,
            }}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Type */}
              <div>
                <label
                  htmlFor="policy-filter-type"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Type
                </label>
          
                <select
                  id="policy-filter-type"
                  name="type"
                  value={filterForm.type}
                  onChange={updateFilterField}
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                >
                  <option value="">All types</option>
                  <option value="privacy">Privacy</option>
                  <option value="terms">Terms</option>
                  <option value="cookies">Cookies</option>
                  <option value="cookie_banner">
                    Cookie Banner
                  </option>
                </select>
              </div>
          
              {/* Language */}
              <div>
                <label
                  htmlFor="policy-filter-lang"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Language
                </label>
          
                <select
                  id="policy-filter-lang"
                  name="lang"
                  value={filterForm.lang}
                  onChange={updateFilterField}
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                >
                  <option value="">All languages</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="fa">فارسی</option>
                </select>
              </div>
          
              {/* Status */}
              <div>
                <label
                  htmlFor="policy-filter-status"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Status
                </label>
          
                <select
                  id="policy-filter-status"
                  name="status"
                  value={filterForm.status}
                  onChange={updateFilterField}
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="published">
                    Published
                  </option>
                  <option value="superseded">
                    Superseded
                  </option>
                </select>
              </div>
          
              {/* Version */}
              <div>
                <label
                  htmlFor="policy-filter-version"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Version
                </label>
          
                <input
                  id="policy-filter-version"
                  name="version"
                  type="text"
                  value={filterForm.version}
                  onChange={updateFilterField}
                  placeholder="Example: v1.2"
                  autoComplete="off"
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                />
              </div>
          
              {/* Created By */}
              <div className="md:col-span-2">
                <label
                  htmlFor="policy-filter-created-by"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Created by
                </label>
          
                <input
                  id="policy-filter-created-by"
                  name="created_by"
                  type="text"
                  value={filterForm.created_by}
                  onChange={updateFilterField}
                  placeholder="Search by admin email"
                  autoComplete="off"
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                />
              </div>
          
              {/* Date From */}
              <div>
                <label
                  htmlFor="policy-filter-date-from"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Date from
                </label>
          
                <input
                  id="policy-filter-date-from"
                  name="date_from"
                  type="date"
                  value={filterForm.date_from}
                  max={
                    filterForm.date_to ||
                    undefined
                  }
                  onChange={updateFilterField}
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                />
              </div>
          
              {/* Date To */}
              <div>
                <label
                  htmlFor="policy-filter-date-to"
                  className="mb-1 block text-sm"
                  style={{ color: subtleText }}
                >
                  Date to
                </label>
          
                <input
                  id="policy-filter-date-to"
                  name="date_to"
                  type="date"
                  value={filterForm.date_to}
                  min={
                    filterForm.date_from ||
                    undefined
                  }
                  onChange={updateFilterField}
                  className="w-full rounded-md border p-2"
                  style={{
                    color: textColor,
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                />
              </div>
            </div>
          
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  filterSubmitting ||
                  listLoading
                }
                className="rounded-md bg-turquoise px-4 py-2 font-medium text-white hover:bg-turquoise/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {filterSubmitting
                  ? "Searching..."
                  : "Search"}
              </button>
          
              <button
                type="button"
                onClick={resetPolicyFilters}
                disabled={
                  filterSubmitting ||
                  listLoading
                }
                className="rounded-md border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  color: textColor,
                  backgroundColor: cardBg,
                  borderColor,
                }}
              >
                Clear
              </button>
            </div>
          </form>
        
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead
                style={{
                  backgroundColor:
                    theme === "dark"
                      ? "#1e293b"
                      : "#f5f7fa",
                }}
              >
                <tr>
                  <th className="p-2 text-left">
                    Type
                  </th>
        
                  <th className="p-2 text-left">
                    Lang
                  </th>
        
                  <th className="p-2 text-left">
                    Version
                  </th>
        
                  <th className="p-2 text-left">
                    Status
                  </th>
        
                  <th className="p-2 text-left">
                    Created By
                  </th>
        
                  <th className="p-2 text-left">
                    Published
                  </th>
        
                  <th className="p-2 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
        
              <tbody>
                {listLoading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center"
                      style={{
                        color: subtleText,
                      }}
                    >
                      Loading policies…
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => {
                    const isPublished =
                      policy.status ===
                      "published";
        
                    const displayedDate =
                      policy.published_at ||
                      policy.created_at;
        
                    return (
                      <tr
                        key={policy.id}
                        className="border-t"
                        style={{ borderColor }}
                      >
                        <td className="p-2">
                          {policy.type}
                        </td>
        
                        <td className="p-2">
                          {policy.lang}
                        </td>
        
                        <td className="p-2">
                          {policy.version}
                        </td>
        
                        <td className="p-2">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor:
                                isPublished
                                  ? "rgba(34, 197, 94, 0.14)"
                                  : "rgba(148, 163, 184, 0.18)",
        
                              color:
                                isPublished
                                  ? "#16a34a"
                                  : subtleText,
                            }}
                          >
                            {isPublished
                              ? "Published"
                              : "Superseded"}
                          </span>
                        </td>
        
                        <td className="p-2">
                          {policy.created_by_email ||
                            "—"}
                        </td>
        
                        <td className="p-2">
                          {displayedDate
                            ? new Date(
                                displayedDate
                              ).toLocaleString()
                            : "—"}
                        </td>
        
                        <td className="p-2 text-center whitespace-nowrap">
                          {canManagePolicies &&
                            isPublished && (
                              <button
                                type="button"
                                onClick={() =>
                                  editPolicy(
                                    policy.id
                                  )
                                }
                                disabled={
                                  detailsLoading
                                }
                                className="text-blue-400 hover:underline mx-1 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit
                              </button>
                            )}
        
                          <button
                            type="button"
                            onClick={() =>
                              openHistory(
                                policy.type,
                                policy.lang
                              )
                            }
                            className="text-turquoise hover:underline mx-1"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
        
                {!listLoading &&
                  policies.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-4 text-center"
                        style={{
                          color: subtleText,
                        }}
                      >
                        No policies found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={listLoading}
          />
        </div>        

        {/* ===== History Modal ===== */}
        {historyOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => {
              setHistoryOpen(false);
              setHistoryList([]);
              setHistoryPagination(null);
            }}
          >
            <div
              className="w-[95%] md:w-[900px] rounded-2xl shadow-2xl border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex justify-between items-center px-5 py-3 border-b"
                style={{ borderColor }}
              >
                <h3 className="text-lg font-semibold">
                  History — {historyKey.type} / {historyKey.lang}
                </h3>

                <button
                  onClick={() => {
                    setHistoryOpen(false);
                    setHistoryList([]);
                    setHistoryPagination(null);
                  }}
                  className="px-3 py-1.5 rounded-md border"
                  style={{
                    color: textColor,
                    backgroundColor: inputBg,
                    borderColor,
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[75vh]">
                {historyLoading ? (
                  <div
                    className="py-10 text-center"
                    style={{ color: subtleText }}
                  >
                    Loading history…
                  </div>
                ) : historyList.length > 0 ? (
                  <>
                    {historyList.map((h) => {
                      const isPublished =
                        h.status === "published";
              
                      const isSuperseded =
                        h.status === "superseded";
              
                      const canRestore =
                        canManagePolicies &&
                        isSuperseded;
              
                      const displayedDate =
                        h.published_at ||
                        h.created_at;
              
                      return (
                        <div
                          key={h.id}
                          className="rounded-xl border p-4 mb-3"
                          style={{ borderColor }}
                        >
                          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                            <div
                              className="text-sm space-y-1"
                              style={{ color: subtleText }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <b>Version:</b>
              
                                <span
                                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                                  style={{
                                    borderColor,
                                    backgroundColor: inputBg,
                                    color: textColor,
                                  }}
                                >
                                  {h.version}
                                </span>
                              </div>
              
                              <div className="flex flex-wrap items-center gap-2">
                                <b>Status:</b>
              
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor: isPublished
                                      ? "rgba(34, 197, 94, 0.14)"
                                      : "rgba(148, 163, 184, 0.18)",
              
                                    color: isPublished
                                      ? "#16a34a"
                                      : subtleText,
                                  }}
                                >
                                  {isPublished
                                    ? "Published"
                                    : isSuperseded
                                    ? "Superseded"
                                    : h.status || "Unknown"}
                                </span>
                              </div>
              
                              <div>
                                <b>Created by:</b>{" "}
                                {h.created_by_email || "—"}
                              </div>
              
                              <div>
                                <b>Published:</b>{" "}
                                {displayedDate
                                  ? new Date(
                                      displayedDate
                                    ).toLocaleString()
                                  : "—"}
                              </div>
              
                              <div>
                                <b>Change note:</b>{" "}
                                {h.change_note ||
                                  "No change note recorded."}
                              </div>
                            </div>
              
                            {canRestore && (
                              <button
                                type="button"
                                onClick={() =>
                                  restoreVersion(h.id)
                                }
                                className="shrink-0 px-3 py-1.5 rounded-md bg-turquoise text-white hover:bg-turquoise/80"
                              >
                                🔁 Restore as new version
                              </button>
                            )}
                          </div>
              
                          {h.type !== "cookie_banner" ? (
                            <div
                              className="border rounded-md p-3 prose prose-sm max-w-none"
                              style={{
                                borderColor,
                                backgroundColor: inputBg,
                                color: textColor,
                              }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  DOMPurify.sanitize(
                                    h.content || ""
                                  ),
                              }}
                            />
                          ) : (
                            <pre
                              className="text-sm p-3 rounded-md border whitespace-pre-wrap break-words"
                              style={{
                                borderColor,
                                backgroundColor: inputBg,
                                color: textColor,
                              }}
                            >
                              {h.content || ""}
                            </pre>
                          )}
                        </div>
                      );
                    })}
              
                    <Pagination
                      pagination={historyPagination}
                      onPageChange={
                        changeHistoryPage
                      }
                      disabled={historyLoading}
                    />
                  </>
                ) : (
                  <div
                    className="py-10 text-center"
                    style={{ color: subtleText }}
                  >
                    No history found for this policy.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
