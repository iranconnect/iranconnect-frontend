//pages/admin/contact-requests.js
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient"; 
import AdminLayout from "../../components/admin/AdminLayout";
import ContactRequestDetailsModal from "../../components/admin/ContactRequestDetailsModal";

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // فیلترها
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // کنترل دسترسی با HttpOnly Cookie
  const [authChecked, setAuthChecked] = useState(false);

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
        fetchRequests();
      } catch {
        window.location.href = "/auth/login";
      }
    }

    checkAccess();
  }, []);

  // دریافت داده‌ها از API
  async function fetchRequests() {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (searchName) params.name = searchName;
      if (searchEmail) params.email = searchEmail;
      if (searchSubject) params.subject = searchSubject;
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const res = await apiClient.get("/admin/contact-requests", {
        params,
        withCredentials: true,
      });

      setRequests(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ Fetch contact requests error:", err);
      setError(err.response?.data?.error || "Failed to load contact requests.");
    } finally {
      setLoading(false);
    }
  }

  // پاک کردن فیلترها
  function clearFilters() {
    setSearchName("");
    setSearchEmail("");
    setSearchSubject("");
    setFilterStatus("");
    setFilterDate("");
    fetchRequests();
  }

  // Pagination Logic
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentData = requests.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(requests.length / perPage);

  // جلوگیری از رندر قبل از تأیید Auth
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
        <section className="admin-section">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-5 flex items-center gap-2">
            📩 Contact Requests
          </h2>

          {/* فیلترها */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <input
              type="text"
              placeholder="Filter by name..."
              className="admin-input w-40"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by email..."
              className="admin-input w-48"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by subject..."
              className="admin-input w-48"
              value={searchSubject}
              onChange={(e) => setSearchSubject(e.target.value)}
            />

            <select
              className="admin-input w-40"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="handled">Handled</option>
            </select>

            <input
              type="date"
              className="admin-input w-40"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <button
              onClick={fetchRequests}
              className="admin-btn admin-btn-primary text-sm px-5 py-2"
            >
              Search
            </button>

            <button
              onClick={clearFilters}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2"
            >
              Clear
            </button>

            {/* Export Buttons */}
            <div className="flex flex-row gap-3 ml-auto">
              <button
                onClick={() =>
                  window.open("/api/admin/contact-requests/export/xlsx", "_blank")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
              >
                Export XLSX
              </button>

              <button
                onClick={() =>
                  window.open("/api/admin/contact-requests/export/pdf", "_blank")
                }
                className="admin-btn admin-btn-primary px-4 py-2 text-sm font-medium"
              >
                Export PDF
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm opacity-70">Loading contact requests...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-[var(--text)]">
                <thead className="opacity-80">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Subject</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {currentData.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--bg)]/40 transition"
                    >
                      <td className="p-3">{r.name}</td>
                      <td className="p-3">{r.email}</td>
                      <td className="p-3 capitalize">
                        {r.subject_type.replace(/_/g, " ")}
                      </td>

                      <td className="p-3 text-center">
                        {r.status === "handled" ? "✅ Handled" : "🕓 Pending"}
                      </td>

                      <td className="p-3">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!currentData.length && (
                    <tr>
                      <td colSpan="6" className="text-center opacity-70 p-4">
                        No contact requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === num
                        ? "bg-turquoise text-navy shadow-md"
                        : "border border-[var(--border)] hover:bg-[var(--card-bg)]"
                    }`}
                  >
                    {num}
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {selectedRequest && (
        <ContactRequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          refresh={fetchRequests}
        />
      )}
    </AdminLayout>
  );
}
