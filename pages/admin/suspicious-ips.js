// frontend/pages/admin/suspicious-ips.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/admin/AdminLayout";
import apiClient from "../../utils/apiClient";
import SuspiciousIPDetailsModal from "../../components/admin/SuspiciousIPDetailsModal";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";

export default function AdminSuspiciousIPsPage() {
  return (
    <AdminLayout allowedRoles={["superadmin"]}>
      <AdminSuspiciousIPsContent />
    </AdminLayout>
  );
}

function AdminSuspiciousIPsContent() {
  const router = useRouter();

  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

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
  
  const [selectedIP, setSelectedIP] = useState(null);
  
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );
  
  const [draftFilters, setDraftFilters] = useState({
    ip: "",
    type: "",
    severity: "",
    status: "",
  });
  
  const {
    isReady,
    page,
    limit,
    filters,
    setPage,
    applyFilters,
  } = usePaginationQuery({
    filterKeys: [
      "ip",
      "type",
      "severity",
      "status",
    ],
    defaultLimit: 10,
  });

  useEffect(() => {
    if (!isReady) {
      return;
    }
  
    setDraftFilters({
      ip: filters.ip || "",
      type: filters.type || "",
      severity: filters.severity || "",
      status: filters.status || "",
    });
  }, [
    isReady,
    filters.ip,
    filters.type,
    filters.severity,
    filters.status,
  ]);
  
    useEffect(() => {
      if (!isReady) {
        return;
      }
  
      fetchSuspiciousIPs();
    }, [
      isReady,
      page,
      limit,
      filters.ip,
      filters.type,
      filters.severity,
      filters.status,
    ]);
  
  async function fetchSuspiciousIPs() {
    setLoading(true);
  
    try {
      const res = await apiClient.get(
        "/admin/suspicious-ips",
        {
          params: {
            page,
            limit,
            ip: filters.ip?.trim() || undefined,
            type: filters.type || undefined,
            severity: filters.severity || undefined,
            status: filters.status || undefined,
          },
          withCredentials: true,
        }
      );
  
      setIps(res.data?.rows || []);
  
      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error(
        "Failed to fetch suspicious IPs:",
        err
      );

      if (err.response?.status === 403) {
        router.replace("/403");
        return;
      }

      setIps([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }
  
  function handleSearch(event) {
    event.preventDefault();
  
    applyFilters({
      ip: draftFilters.ip,
      type: draftFilters.type,
      severity: draftFilters.severity,
      status: draftFilters.status,
    });
  }
  
  function handleClear() {
    setDraftFilters({
      ip: "",
      type: "",
      severity: "",
      status: "",
    });
  
    applyFilters({
      ip: "",
      type: "",
      severity: "",
      status: "",
    });
  }

  async function handleExport(format) {
    try {
      const res = await apiClient.get(
        `/admin/suspicious-ips/export/${format}`,
        {
          params: {
            ip: filters.ip?.trim() || undefined,
            type: filters.type || undefined,
            severity: filters.severity || undefined,
            status: filters.status || undefined,
          },
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
          ? "IranConnect_SuspiciousIPs_Report.xlsx"
          : "IranConnect_SuspiciousIPs_Report.pdf";
  
      document.body.appendChild(link);
  
      link.click();
  
      link.remove();
  
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "❌ Suspicious IP export failed:",
        err
      );
  
      if (err.response?.status === 403) {
        alert(
          "You do not have permission to export suspicious IP reports."
        );
        return;
      }
  
      alert(
        err.response?.data?.error ||
          `Failed to export ${format.toUpperCase()}.`
      );
    }
  }

  return (
    <>
      <div className="admin-container">
        <section className="admin-section">
          <h2 className="admin-title mb-5">🚨 Suspicious IP Addresses</h2>

          {/* Overview Card */}
          <div className="admin-card mb-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-turquoise mb-2">
                  🔐 Suspicious IP Detection Overview
                </h3>

                <p className="text-xs opacity-80 leading-relaxed">
                  IranConnect automatically detects abusive or suspicious IP
                  behavior. Account lockout applies to user accounts, while IP
                  blocking applies to network-level behavior.
                </p>

                <ul className="mt-3 space-y-1 text-xs opacity-90">
                  <li>• Brute Force: 9 attempts / 10 min → block</li>
                  <li>• 404 Scan: 15 attempts / 5 min → block</li>
                  <li>• Sensitive Paths: 3 attempts → block</li>
                  <li>• Payload Injection: 2 attempts → block</li>
                  <li>• Burst Traffic: 30 req / 10 sec → block</li>
                  <li>• User-Agent Anomaly: instant block</li>
                  <li>• Rate Limit: 200 req / 15 min → log only</li>
                  <li>
                    • Account Lockout: 10 failed logins within 15 minutes →
                    temporary lock
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowRules(true)}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm"
              >
                View Full Rules
              </button>
            </div>
          </div>

          {/* Filters */}
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <input
              className="admin-input w-48"
              placeholder="Filter by IP"
              value={draftFilters.ip}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  ip: event.target.value,
                }))
              }
            />

            <select
              className="admin-input w-40"
              value={draftFilters.type}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
            >
              <option value="">All Types</option>
              <option value="brute_force">Brute Force</option>
              <option value="404_scan">404 Scan</option>
              <option value="sensitive_path">Sensitive Path</option>
              <option value="payload_injection">Payload Injection</option>
              <option value="burst">Burst</option>
              <option value="user_agent_anomaly">User-Agent Anomaly</option>
              <option value="rate_limit">Rate Limit</option>
            </select>

            <select
              className="admin-input w-36"
              value={draftFilters.severity}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  severity: event.target.value,
                }))
              }
            >
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              className="admin-input w-36"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="">All Status</option>
              <option value="blocked">Blocked</option>
              <option value="unblocked">Unblocked</option>
              <option value="not_blocked">Not Blocked</option>
            </select>

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

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleExport("xlsx")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                Export XLSX
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleExport("pdf")}
                className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                Export PDF
              </button>
            </div>
          </form>

          {/* Table */}
          {loading ? (
            <p className="text-sm opacity-70">Loading suspicious IPs...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Suspicious Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Attempts</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ips.length ? (
                      ips.map((ip) => (
                        <tr key={ip.ip_address}>
                          <td>{ip.ip_address}</td>
                          <td>{ip.suspicious_types?.join(" / ")}</td>
                          <td>{ip.severity_levels?.join(" / ")}</td>
                          <td>
                            {ip.block_status === "blocked"
                              ? "Blocked"
                              : ip.block_status === "unblocked"
                              ? "Unblocked"
                              : "Not Blocked"}
                          </td>
                          <td>{ip.total_attempts}</td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIP({
                                  ip_address: ip.ip_address,
                                })
                              }
                              className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center opacity-70 p-4">
                          No record found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                disabled={loading}
              />
            </>
          )}

          {selectedIP && (
            <SuspiciousIPDetailsModal
              ipRecord={selectedIP}
              onClose={() => setSelectedIP(null)}
              currentUserRole="superadmin"
            />
          )}
        </section>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="admin-card w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowRules(false)}
              className="absolute right-4 top-3 text-turquoise text-lg font-bold"
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold text-center text-turquoise mb-4">
              🔐 IranConnect Security Rules
            </h2>

            <table className="admin-table text-sm">
              <thead>
                <tr>
                  <th>Behavior</th>
                  <th>Threshold</th>
                  <th>Window</th>
                  <th>Severity</th>
                  <th>Auto-Block</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Brute Force</td>
                  <td>9 attempts</td>
                  <td>10 minutes</td>
                  <td>High</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>404 Scan</td>
                  <td>15 attempts</td>
                  <td>5 minutes</td>
                  <td>Low</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Sensitive Path</td>
                  <td>3 attempts</td>
                  <td>—</td>
                  <td>Medium</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Payload Injection</td>
                  <td>2 attempts</td>
                  <td>5 minutes</td>
                  <td>Critical</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Burst Traffic</td>
                  <td>30 requests</td>
                  <td>10 sec</td>
                  <td>Medium</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>User-Agent Anomaly</td>
                  <td>1 attempt</td>
                  <td>Instant</td>
                  <td>High</td>
                  <td>Immediate</td>
                </tr>
                <tr>
                  <td>Rate Limit</td>
                  <td>200 requests</td>
                  <td>15 minutes</td>
                  <td>Medium</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
