// frontend/pages/admin/claims.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient"; 
import AdminLayout from "../../components/admin/AdminLayout";
import ClaimDetailsModal from "../../components/admin/ClaimDetailsModal";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 🧭 بررسی نقش و ورود با HttpOnly Cookie
  useEffect(() => {
    async function checkAccess() {
      try {
        const me = await apiClient.get("/auth/me", {
          withCredentials: true,
        });

        if (!me.data?.ok) {
          window.location.href = "/auth/login";
          return;
        }

        if (me.data.role !== "admin" && me.data.role !== "superadmin") {
          window.location.href = "/";
          return;
        }

        setAuthChecked(true);
        fetchClaims();
      } catch (err) {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();
  }, [statusFilter]);

  // 📜 دریافت درخواست‌های Claim
  async function fetchClaims() {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/claims", {
        params: statusFilter ? { status: statusFilter } : {},
      });

      setClaims(res.data || []);
      setFilteredClaims(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching claims:", err);
      setClaims([]);
      setFilteredClaims([]);
    } finally {
      setLoading(false);
    }
  }

  // 🔍 جستجو
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredClaims(
      claims.filter(
        (c) =>
          c.business_name?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower) ||
          c.full_name?.toLowerCase().includes(lower) ||
          c.user_email?.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, claims]);

  // 🔵 تأیید
  async function handleApprove(id, note = "") {
    if (!note.trim()) {
      alert("Approval note is required.");
      return;
    }
    if (!confirm("Confirm approval?")) return;

    try {
      await apiClient.post(`/admin/claims/${id}/approve`, { note });
      fetchClaims();
      setSelectedClaim(null);
    } catch (err) {
      console.error("❌ Approve error:", err);
      alert(err.response?.data?.error || "Error approving claim.");
    }
  }

  // 🔴 رد درخواست
  async function handleReject(id, note = "") {
    if (!note.trim()) {
      alert("Rejection note is required.");
      return;
    }

    try {
      await apiClient.post(`/admin/claims/${id}/reject`, { note });
      fetchClaims();
      setSelectedClaim(null);
    } catch (err) {
      console.error("❌ Reject error:", err);
      alert(err.response?.data?.error || "Error rejecting claim.");
    }
  }

  // 📤 XLSX
  async function handleExportXLSX() {
    try {
      const res = await apiClient.get(`/admin/claims/export/xlsx`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "IranConnect_Claims_Report.xlsx";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ XLSX export error:", err);
      alert("Failed to export XLSX.");
    }
  }

  // 📄 PDF
  async function handleExportPDF() {
    try {
      const res = await apiClient.get(`/admin/claims/export/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "IranConnect_Claims_Report.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ PDF export error:", err);
      alert("Failed to export PDF.");
    }
  }

  // تا قبل از AuthChecked هیچ رندری انجام نده
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access...
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-section">
          <h2 className="admin-title mb-4">📨 Business Claim Requests</h2>

          {/* 🔹 فیلتر + جستجو + خروجی */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-input w-48"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_review">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search business, applicant, email, or user..."
              className="admin-input w-60"
            />

            <div className="flex flex-row flex-wrap gap-3 items-center">
              <button
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
                onClick={fetchClaims}
              >
                Refresh
              </button>
              <button
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
                onClick={handleExportXLSX}
              >
                Export XLSX
              </button>
              <button
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
                onClick={handleExportPDF}
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* 🔹 جدول */}
          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : filteredClaims.length === 0 ? (
            <p className="admin-muted">No claim requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Applicant</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Submitted by (User)</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClaims.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-[120px] truncate">{c.business_name}</td>
                      <td className="max-w-[100px] truncate">{c.full_name || "—"}</td>
                      <td>{c.applicant_role || "—"}</td>
                      <td className="max-w-[100px] truncate">{c.email}</td>
                      <td className="max-w-[100px] truncate opacity-80">
                        {c.user_email || c.email || "—"}
                      </td>

                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            c.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : c.status === "pending_review"
                              ? "bg-yellow-100 text-yellow-700"
                              : c.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td>{new Date(c.created_at).toLocaleDateString()}</td>

                      <td>
                        <button
                          className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          onClick={() => setSelectedClaim(c)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 مودال جزئیات */}
      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onApprove={(note) => handleApprove(selectedClaim.id, note)}
          onReject={(note) => handleReject(selectedClaim.id, note)}
        />
      )}
    </AdminLayout>
  );
}
