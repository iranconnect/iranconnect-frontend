// frontend/pages/admin/bulk-email.js
import { useEffect, useRef, useState } from "react";

import apiClient from "../../utils/apiClient";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuthSession } from "../../hooks/useAuthSession";
import AdminRichTextEditor from "../../components/admin/AdminRichTextEditor";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";
import DOMPurify from "isomorphic-dompurify";

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

  return new Date(value).toLocaleString("en-GB");
}

function truncate(text, length = 25) {
  if (!text) {
    return "—";
  }

  return text.length > length
    ? `${text.slice(0, length)}...`
    : text;
}

export default function BulkEmailPage() {

  /* ============================================================
     Send form
  ============================================================ */
  const [senderEmail, setSenderEmail] = useState(
    "privacy@iranconnect.org"
  );

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  /* ============================================================
     Auth
  ============================================================ */
  const { status: authStatus, role } = useAuthSession();

  const authChecked =
    authStatus === "authenticated" &&
    ["admin", "superadmin"].includes(role);

  const isSuperAdmin =
    role === "superadmin";

  /* ============================================================
     Logs
  ============================================================ */
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const latestRequestIdRef = useRef(0);

  const [draftFilters, setDraftFilters] = useState({
    bulk_code: "",
    sender_email: "",
    admin_email: "",
    date: "",
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
      "bulk_code",
      "sender_email",
      "admin_email",
      "date",
    ],
    defaultLimit: 10,
  });

  /* ============================================================
     Sync URL filters → form state
  ============================================================ */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      bulk_code: filters.bulk_code || "",
      sender_email: filters.sender_email || "",
      admin_email: filters.admin_email || "",
      date: filters.date || "",
    });
  }, [
    isReady,
    filters.bulk_code,
    filters.sender_email,
    filters.admin_email,
    filters.date,
  ]);

  /* ============================================================
     Fetch logs after URL/query changes
  ============================================================ */
  useEffect(() => {
    if (!authChecked || !isReady) {
      return;
    }

    fetchLogs();
  }, [
    authChecked,
    isReady,
    page,
    limit,
    filters.bulk_code,
    filters.sender_email,
    filters.admin_email,
    filters.date,
  ]);

  async function fetchLogs() {
    const requestId =
      latestRequestIdRef.current + 1;

    latestRequestIdRef.current = requestId;

    setLogsLoading(true);
    setLogsError("");

    try {
      const res = await apiClient.get(
        "/admin/bulk-email/logs",
        {
          params: {
            page,
            limit,
            bulk_code:
              filters.bulk_code || undefined,
            sender_email:
              filters.sender_email || undefined,
            admin_email:
              filters.admin_email || undefined,
            date: filters.date || undefined,
          },
          withCredentials: true,
        }
      );

      if (
        requestId !== latestRequestIdRef.current
      ) {
        return;
      }

      const payload = res.data;

      /*
        سازگاری موقت با پاسخ قدیمی Backend،
        در صورت برگشت به نسخه قدیمی.
      */
      if (Array.isArray(payload)) {
        setLogs(payload);

        setPagination({
          page: 1,
          limit: payload.length || 10,
          total: payload.length,
          totalPages: 1,
          from: payload.length ? 1 : 0,
          to: payload.length,
          hasPreviousPage: false,
          hasNextPage: false,
        });

        return;
      }

      setLogs(payload?.rows || []);

      setPagination(
        payload?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      if (
        requestId !== latestRequestIdRef.current
      ) {
        return;
      }

      console.error(
        "❌ Error fetching bulk email logs:",
        err
      );

      setLogs([]);
      setPagination(DEFAULT_PAGINATION);

      setLogsError(
        err.response?.data?.error ||
          "Failed to load bulk email logs."
      );
    } finally {
      if (
        requestId === latestRequestIdRef.current
      ) {
        setLogsLoading(false);
      }
    }
  }

  /* ============================================================
     Apply filters
  ============================================================ */
  function handleSearch(event) {
    event.preventDefault();

    applyFilters({
      bulk_code: draftFilters.bulk_code,
      sender_email: draftFilters.sender_email,
      admin_email: draftFilters.admin_email,
      date: draftFilters.date,
    });
  }

  /* ============================================================
     Clear filters
  ============================================================ */
  async function handleClear() {
    setDraftFilters({
      bulk_code: "",
      sender_email: "",
      admin_email: "",
      date: "",
    });

    await clearFilters();
  }

  async function handleSingleReportDownload(
    reportId,
    format
  ) {
    try {
      const response = await apiClient.get(
        `/admin/bulk-email/report/${reportId}/${format}`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
  
      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  
      const blob = new Blob(
        [response.data],
        { type: mimeType }
      );
  
      const objectUrl =
        window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
  
      link.href = objectUrl;
  
      link.download =
        format === "pdf"
          ? `bulk_email_report_${reportId}.pdf`
          : `bulk_email_report_${reportId}.xlsx`;
  
      document.body.appendChild(link);
  
      link.click();
  
      link.remove();
  
      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (err) {
      console.error(
        "❌ Bulk email report download failed:",
        err
      );
  
      alert(
        err.response?.data?.error ||
          "Failed to download this report."
      );
    }
  }

  /* ============================================================
     Send email — SuperAdmin only
  ============================================================ */
  async function handleSendEmail() {
    if (!isSuperAdmin) {
      return;
    }

    if (!subject.trim() || !body.trim()) {
      alert("Please enter subject and body.");
      return;
    }

    setSending(true);

    try {
      if (attachments.length > 0) {
        const payload = new FormData();

        payload.append(
          "sender_email",
          senderEmail
        );

        payload.append("subject", subject);
        payload.append("body", body);

        attachments.forEach((file) => {
          payload.append("attachments", file);
        });

        await apiClient.post(
          "/admin/bulk-email/send",
          payload,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
            withCredentials: true,
          }
        );
      } else {
        await apiClient.post(
          "/admin/bulk-email/send",
          {
            sender_email: senderEmail,
            subject,
            body,
          },
          {
            withCredentials: true,
          }
        );
      }

      alert("✅ Emails sent successfully!");

      setSubject("");
      setBody("");
      setAttachments([]);

      await fetchLogs();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "❌ Error sending bulk emails:",
          err
        );
      }

      alert(
        err.response?.data?.error ||
          "Error sending emails."
      );
    } finally {
      setSending(false);
    }
  }

  if (!authChecked) {
    return (
      <AdminLayout>
        <div className="admin-container">
          <p className="text-center text-gray-500">
            Checking access...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="mb-6">
          <h1 className="admin-title">
            📨 Bulk Email Manager
          </h1>

          <p className="admin-muted">
            Send announcements or policy updates to all users.
          </p>
        </div>

        {/* ====================================================
           SEND EMAIL — SuperAdmin only
        ==================================================== */}
        {isSuperAdmin && (
          <section
            className="admin-section mb-10"
            style={{ overflow: "visible" }}
          >
            <h2 className="admin-title mb-4">
              ✉️ Send Bulk Email
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Sender Email
                </label>

                <select
                  className="admin-input"
                  value={senderEmail}
                  onChange={(event) =>
                    setSenderEmail(
                      event.target.value
                    )
                  }
                >
                  <option>
                    privacy@iranconnect.org
                  </option>

                  <option>
                    support@iranconnect.org
                  </option>

                  <option>
                    info@iranconnect.org
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-sm font-medium">
                  Subject
                </label>

                <input
                  type="text"
                  className="admin-input"
                  placeholder="Enter subject..."
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                Attachments
              </label>

              <input
                type="file"
                multiple
                onChange={(event) =>
                  setAttachments(
                    Array.from(event.target.files || [])
                  )
                }
                className="admin-input"
              />

              {attachments.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {attachments.length} file(s) selected
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Email Content
                </label>

                <AdminRichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Write your email content here..."
                  minHeight={300}
                  enableImages
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Live Preview
                </label>

                <div
                  className="admin-card min-h-[300px] overflow-y-auto text-[var(--text)]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      body ||
                        "<p><i>Live preview will appear here...</i></p>"
                    ),
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sending}
                className="admin-btn admin-btn-primary disabled:opacity-60"
              >
                {sending
                  ? "Sending..."
                  : "Send Email"}
              </button>
            </div>
          </section>
        )}

        {/* ====================================================
           LOGS
        ==================================================== */}
        <section className="admin-section">
          <h2 className="admin-title mb-5">
            📋 Sent Email Logs
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-3 mb-6 items-center"
          >
            <input
              type="text"
              placeholder="Bulk code, e.g. BID-000001"
              className="admin-input w-52"
              value={draftFilters.bulk_code}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  bulk_code: event.target.value,
                }))
              }
            />

            <input
              type="text"
              placeholder="Sender email..."
              className="admin-input w-52"
              value={draftFilters.sender_email}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  sender_email: event.target.value,
                }))
              }
            />

            <input
              type="text"
              placeholder="Admin email..."
              className="admin-input w-52"
              value={draftFilters.admin_email}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  admin_email: event.target.value,
                }))
              }
            />

            <input
              type="date"
              className="admin-input w-44"
              value={draftFilters.date}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />

            <button
              type="submit"
              disabled={logsLoading}
              className="admin-btn admin-btn-primary text-sm px-5 py-2 disabled:opacity-60"
            >
              Search
            </button>

            <button
              type="button"
              disabled={logsLoading}
              onClick={handleClear}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={logsLoading}
              onClick={fetchLogs}
              className="admin-btn admin-btn-secondary text-sm px-4 py-2 disabled:opacity-60"
            >
              Refresh
            </button>
          </form>

          {logsError && (
            <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              {logsError}
            </p>
          )}

          {logsLoading ? (
            <p className="admin-muted">
              Loading email logs...
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th>Bulk Code</th>
                      <th>Sender Email</th>
                      <th>Subject</th>
                      <th>Sent Count</th>
                      <th>Date</th>
                      <th>Admin Email</th>
                      <th>Report</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-medium">
                          {log.bulk_code ||
                            `BID-${String(
                              log.id
                            ).padStart(6, "0")}`}
                        </td>

                        <td title={log.sender_email}>
                          {truncate(log.sender_email)}
                        </td>

                        <td title={log.subject}>
                          {truncate(log.subject, 35)}
                        </td>

                        <td>
                          {log.sent_count}/
                          {log.total_count}
                        </td>

                        <td>
                          {formatDateTime(
                            log.created_at
                          )}
                        </td>

                        <td
                          title={log.admin_email}
                          className="text-blue-700"
                        >
                          {truncate(log.admin_email)}
                        </td>

                        <td>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleSingleReportDownload(
                                  log.id,
                                  "pdf"
                                )
                              }
                              className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                            >
                              PDF
                            </button>
                        
                            <button
                              type="button"
                              onClick={() =>
                                handleSingleReportDownload(
                                  log.id,
                                  "xlsx"
                                )
                              }
                              className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                            >
                              XLSX
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!logs.length && (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-4 opacity-70"
                        >
                          No email logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!logsError && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={logsLoading}
                />
              )}
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
