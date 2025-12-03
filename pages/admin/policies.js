// frontend/pages/admin/policies.js
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function PoliciesAdmin() {
  const [policies, setPolicies] = useState([]);
  const [type, setType] = useState("privacy");
  const [lang, setLang] = useState("en");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState("light");
  const [authChecked, setAuthChecked] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyKey, setHistoryKey] = useState({ type: "privacy", lang: "en" });
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ============================================================
     🔐 احراز هویت — فقط admin + superadmin
  ============================================================= */
  useEffect(() => {
    async function checkAccess() {
      try {
        const me = await apiClient.get("/auth/me", { withCredentials: true });

        if (!me.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        if (me.data.role !== "admin" && me.data.role !== "superadmin") {
          window.location.href = "/";
          return;
        }

        setAuthChecked(true);
        fetchPolicies();

        // Sync theme
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
      } catch (_) {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();
  }, []);

  /* ============================================================
     📄 دریافت لیست پالیسی‌ها
  ============================================================= */
  async function fetchPolicies() {
    try {
      const res = await apiClient.get("/api/policies/admin");
      setPolicies(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load policies.");
    }
  }
  /* ============================================================
     💾 ایجاد / ویرایش پالیسی — admin + superadmin
  ============================================================= */
  async function savePolicy() {
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await apiClient.put(`/api/policies/admin/${editingId}`, {
          type,
          lang,
          content,
        });
      } else {
        await apiClient.post(`/api/policies/admin`, {
          type,
          lang,
          content,
        });
      }

      alert("✅ Policy saved successfully.");
      resetForm();
      await fetchPolicies();
    } catch (err) {
      setError(err.response?.data?.error || "Error saving policy.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePolicy(id) {
    if (!confirm("❗ Delete this policy?")) return;

    try {
      await apiClient.delete(`/api/policies/admin/${id}`);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting policy.");
    }
  }

  function editPolicy(p) {
    setEditingId(p.id);
    setType(p.type);
    setLang(p.lang);
    setContent(p.content);
    setPreview(p.content);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setType("privacy");
    setLang("en");
    setContent("");
    setPreview("");
  }

  /* ============================================================
     🕓 تاریخچه نسخه‌ها
  ============================================================= */
  async function openHistory(t = type, l = lang) {
    try {
      setHistoryLoading(true);
      setHistoryKey({ type: t, lang: l });

      const res = await apiClient.get(
        `/api/policies/admin/history/${t}/${l}`
      );

      setHistoryList(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      alert(err.response?.data?.error || "Error loading history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  /* 🔄 Restore نسخه قبلی */
  async function restoreVersion(id) {
    try {
      await apiClient.post(`/api/policies/admin/restore/${id}`);

      await fetchPolicies();
      await openHistory(historyKey.type, historyKey.lang);

      alert("✅ Restored as new version successfully.");
    } catch (err) {
      alert(err.response?.data?.error || "Error restoring version.");
    }
  }
  /* ============================================================
     🎨 Theme Styles
  ============================================================= */
  const textColor = theme === "dark" ? "#fff" : "#0a1a44";
  const cardBg = theme === "dark" ? "#0f172a" : "var(--card-bg)";
  const borderColor = theme === "dark" ? "#334155" : "var(--border)";
  const inputBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const subtleText = theme === "dark" ? "#cbd5e1" : "#475569";

  const quillStyle = {
    color: textColor,
    backgroundColor: inputBg,
    borderColor,
    fontSize: "15px",
  };

  /* ============================================================
     🛑 Render block until role confirmed
  ============================================================= */
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access…
      </div>
    );
  }

  /* ============================================================
     🎨 UI
  ============================================================= */
  return (
    <AdminLayout>
      <div className="p-6" style={{ color: textColor }}>
        {/* ===== Header ===== */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">🧾 Policy Manager</h1>

          <button
            onClick={() => openHistory(type, lang)}
            className="px-3 py-2 rounded-md border"
            style={{
              backgroundColor: inputBg,
              borderColor,
              color: textColor,
            }}
          >
            🕓 View History ({type} / {lang})
          </button>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
            {error}
          </p>
        )}

        {/* ===== Create/Edit Form ===== */}
        <div
          className="p-6 rounded-2xl shadow-md mb-8 border"
          style={{ backgroundColor: cardBg, borderColor }}
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm mb-1" style={{ color: subtleText }}>
                Policy Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setContent("");
                  setPreview("");
                }}
                className="border p-2 rounded-md w-full"
                style={{
                  color: textColor,
                  backgroundColor: inputBg,
                  borderColor,
                }}
              >
                <option value="privacy">Privacy</option>
                <option value="terms">Terms</option>
                <option value="cookies">Cookies</option>
                <option value="cookie_banner">Cookie Banner</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm mb-1" style={{ color: subtleText }}>
                Language
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="border p-2 rounded-md w-full"
                style={{
                  color: textColor,
                  backgroundColor: inputBg,
                  borderColor,
                }}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="fa">فارسی</option>
              </select>
            </div>
          </div>

          {/* ===== Quill ===== */}
          {type !== "cookie_banner" ? (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  {editingId ? "✏️ Edit Policy" : "➕ New Policy"}
                </h3>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={(v) => {
                    setContent(v);
                    setPreview(v);
                  }}
                  className="rounded-md border"
                  style={quillStyle}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">👁️ Live Preview</h3>
                <div
                  className="border rounded-md p-3 min-h-[200px] prose prose-sm max-w-none"
                  style={{
                    color: textColor,
                    backgroundColor: inputBg,
                    borderColor,
                  }}
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            </div>
          ) : (
            <textarea
              className="w-full border p-3 rounded-md mt-4"
              placeholder='{"title":"We use cookies 🍪"}'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                color: textColor,
                backgroundColor: inputBg,
                borderColor,
              }}
            />
          )}
          {/* ===== Buttons ===== */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={savePolicy}
              disabled={loading}
              className="px-4 py-2 bg-turquoise text-white rounded-md hover:bg-turquoise/80"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "💾 Update (New Version)"
                : "Add Policy"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ===== جدول پالیسی‌ها ===== */}
        <div
          className="p-6 rounded-2xl shadow-md border"
          style={{ backgroundColor: cardBg, borderColor }}
        >
          <h2 className="text-lg font-semibold mb-3">📋 Existing Policies</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead
                style={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#f5f7fa",
                }}
              >
                <tr>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Lang</th>
                  <th className="p-2 text-left">Version</th>
                  <th className="p-2 text-left">Created By</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {policies.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor }}>
                    <td className="p-2">{p.type}</td>
                    <td className="p-2">{p.lang}</td>
                    <td className="p-2">{p.version}</td>
                    <td className="p-2">{p.created_by_email || "—"}</td>
                    <td className="p-2">
                      {new Date(p.created_at).toLocaleString()}
                    </td>

                    <td className="p-2 text-center">
                      <>
                        <button
                          onClick={() => editPolicy(p)}
                          className="text-blue-400 hover:underline mx-1"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deletePolicy(p.id)}
                          className="text-red-400 hover:underline mx-1"
                        >
                          Delete
                        </button>

                        <button
                          onClick={() => openHistory(p.type, p.lang)}
                          className="text-turquoise hover:underline mx-1"
                        >
                          History
                        </button>
                      </>
                    </td>
                  </tr>
                ))}

                {policies.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-4 text-center"
                      style={{ color: subtleText }}
                    >
                      No policies yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Modal تاریخچه ===== */}
        {historyOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setHistoryOpen(false)}
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
                  onClick={() => setHistoryOpen(false)}
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
                  <div style={{ color: subtleText }}>Loading history…</div>
                ) : historyList.length > 0 ? (
                  historyList.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl border p-4 mb-3"
                      style={{ borderColor }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm" style={{ color: subtleText }}>
                          <div>
                            <b>Version:</b> {h.version}
                          </div>
                          <div>
                            <b>Created by:</b> {h.created_by_email || "—"}
                          </div>
                          <div>
                            <b>Date:</b>{" "}
                            {new Date(h.created_at).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => restoreVersion(h.id)}
                          className="px-3 py-1.5 rounded-md bg-turquoise text-white hover:bg-turquoise/80"
                        >
                          🔁 Restore as new version
                        </button>
                      </div>

                      {h.type !== "cookie_banner" ? (
                        <div
                          className="border rounded-md p-3 prose prose-sm max-w-none"
                          style={{
                            borderColor,
                            backgroundColor: inputBg,
                            color: textColor,
                          }}
                          dangerouslySetInnerHTML={{ __html: h.content }}
                        />
                      ) : (
                        <div
                          className="text-sm italic p-2 rounded-md border-dashed border"
                          style={{ borderColor, color: subtleText }}
                        >
                          (Cookie banner content stored as JSON)
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center" style={{ color: subtleText }}>
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
