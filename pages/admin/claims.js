// pages/admin/claims.js
import { useEffect, useState } from "react";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";
import ClaimDetailsModal from "../../components/admin/ClaimDetailsModal";

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

function formatStatus(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClaim, setSelectedClaim] =
    useState(null);

  const { status: authStatus, role } = useAuthSession();
  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const [draftFilters, setDraftFilters] = useState({
    status: "all",
    q: "",
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
    filterKeys: ["status", "q"],
    defaultLimit: 10,
  });

  /* ==========================================================
     Sync URL filters -> form state
  ========================================================== */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      status: filters.status || "all",
      q: filters.q || "",
    });
  }, [
    isReady,
    filters.status,
    filters.q,
  ]);

  /* ==========================================================
     Fetch claims
  ========================================================== */
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }

    fetchClaims();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.status,
    filters.q,
  ]);

  async function fetchClaims() {
    setLoading(true);
    setError("");

    try {
      const status =
        filters.status && filters.status !== "all"
          ? filters.status
          : undefined;

      const q = filters.q?.trim() || undefined;

      const res = await apiClient.get(
        "/admin/claims",
        {
          params: {
            page,
            limit,
            status,
            q,
          },
          withCredentials: true,
        }
      );

      

      setClaims(res.data?.rows || []);

      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error("❌ Error fetching claims:", err);

      setClaims([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Failed to load claim requests."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     Search / Clear
  ========================================================== */
  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      status: draftFilters.status,
      q: draftFilters.q,
    });
  }

  async function handleClear() {
    setDraftFilters({
      status: "all",
      q: "",
    });

    await clearFilters();

    applyFilters({
      status: "all",
    });
  }

  /* ==========================================================
     Approve / Reject
  ========================================================== */
  async function handleApprove(id, note = "") {
    if (!note.trim()) {
      alert("Approval note is required.");
      return;
    }

    if (!window.confirm("Confirm approval?")) {
      return;
    }

    try {
      await apiClient.post(
        `/admin/claims/${id}/approve`,
        { note },
        {
          withCredentials: true,
        }
      );

      setSelectedClaim(null);
      fetchClaims();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Error approving claim."
      );
    }
  }

  async function handleReject(id, note = "") {
    if (!note.trim()) {
      alert("Rejection note is required.");
      return;
    }

    if (!window.confirm("Confirm rejection?")) {
      return;
    }

    try {
      await apiClient.post(
        `/admin/claims/${id}/reject`,
        { note },
        {
          withCredentials: true,
        }
      );

      setSelectedClaim(null);
      fetchClaims();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Error rejecting claim."
      );
    }
  }

  /* ==========================================================
     Export
  ========================================================== */
  async function handleExport(format) {
    try {
      const res = await apiClient.get(
        `/admin/claims/export/${format}`,
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      const blob = new Blob([res.data]);

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download =
        format === "xlsx"
          ? "IranConnect_Claims_Report.xlsx"
          : "IranConnect_Claims_Report.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    } catch {
      alert(`Failed to export ${format.toUpperCase()}.`);
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
        <div className="admin-section">
          <h2 className="admin-title mb-4">
            📨 Business Claim Requests
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="admin-input w-48"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_review">
                Pending Review
              </option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="text"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              placeholder="Search business, applicant, email, or user..."
              className="admin-input w-72"
            />

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              Search
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              Clear
            </button>

            <div className="flex flex-row flex-wrap gap-3 items-center ml-auto">
              <button
                type="button"
                onClick={() => handleExport("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export XLSX
              </button>

              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                Export PDF
              </button>
            </div>
          </form>

          {error && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : (
            <>
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
                    {claims.map((claim) => (
                      <tr key={claim.id}>
                        <td className="max-w-[120px] truncate">
                          {claim.business_name || "—"}
                        </td>

                        <td className="max-w-[100px] truncate">
                          {claim.full_name || "—"}
                        </td>

                        <td>
                          {claim.applicant_role || "—"}
                        </td>

                        <td className="max-w-[100px] truncate">
                          {claim.email || "—"}
                        </td>

                        <td className="max-w-[100px] truncate opacity-80">
                          {claim.user_email || "—"}
                        </td>

                        <td>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              claim.status === "verified"
                                ? "bg-green-100 text-green-700"
                                : claim.status === "pending_review"
                                ? "bg-yellow-100 text-yellow-700"
                                : claim.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {formatStatus(claim.status)}
                          </span>
                        </td>

                        <td>
                          {claim.created_at
                            ? new Date(
                                claim.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                            onClick={() =>
                              setSelectedClaim(claim)
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!claims.length && (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center opacity-70 p-4"
                        >
                          No claim requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!error && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={loading}
                />
              )}
            </>
          )}
        </div>
      </div>

      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onApprove={(note) =>
            handleApprove(selectedClaim.id, note)
          }
          onReject={(note) =>
            handleReject(selectedClaim.id, note)
          }
        />
      )}
    </AdminLayout>
  );
}
