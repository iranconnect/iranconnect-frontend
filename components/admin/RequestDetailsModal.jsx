//frontend/components/admin/RequestDetailsModal.jsx
'use client';
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";

export default function RequestDetailsModal({
  request,
  role,
  onClose,
  refresh,
}) {
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showApproveBox, setShowApproveBox] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);

  /* ---------------------------------------------------------
     ⌨️ Close modal with ESC
  --------------------------------------------------------- */
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ---------------------------------------------------------
     📦 Load request details
  --------------------------------------------------------- */
  useEffect(() => {
    if (request?.id) fetchDetails();
  }, [request]);

  async function fetchDetails() {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/admin/requests/${request.id}`,
        {
          withCredentials: true,
          headers: { "x-iranconnect-admin": "true" },
        }
      );
      setDetails(res.data);
    } catch (err) {
      console.error("❌ Error fetching request details:", err);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------------------
     ✅ Approve / Reject
  --------------------------------------------------------- */
  async function handleAction(action) {
    if (!note.trim()) {
      setErrorMsg("⚠️ Admin note is required.");
      return;
    }
    setErrorMsg("");

    try {
      await apiClient.put(
        `/admin/requests/${request.id}/status`,
        { status: action, admin_note: note },
        {
          withCredentials: true,
          headers: { "x-iranconnect-admin": "true" },
        }
      );
      window.dispatchEvent(
        new Event(
          "iranconnect:business-request-changed"
        )
      );

      refresh();
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ Action failed:", err);
      }
      alert(err.response?.data?.error || "Action failed.");
    }
  }

  /* ---------------------------------------------------------
     📎 Secure Download
  --------------------------------------------------------- */
  function safeParseAttachments(attachments) {
    if (!attachments) return [];
  
    if (typeof attachments === "string") {
      try {
        return JSON.parse(attachments);
      } catch {
        return [];
      }
    }
  
    return attachments;
  }

  if (!details && !loading) {
    console.warn("⚠️ No details received from API");
  }

  const renderPayload = (payload) => {
    if (!payload || typeof payload !== "object") return <p>—</p>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-2">
        {Object.entries(payload).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="font-medium text-turquoise capitalize">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="opacity-80">
              {value === "" || value === null ? "—" : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const isActionable =
    details?.status === "pending" ||
    details?.status === "pending_review";

  const isPendingNewRequest =
    isActionable &&
    details?.request_type === "new";

  const isNewRequestFulfilled =
    isPendingNewRequest &&
    Boolean(details?.business_id);

  const isSuperAdmin =
    role === "superadmin";

  const canProcessRequest =
    isActionable &&
    (
      details?.request_type === "new" ||
      isSuperAdmin
    );

  const canDownloadFiles =
    isSuperAdmin;

  const files = safeParseAttachments(details?.attachments);

  /* ---------------------------------------------------------
     🖼 UI
  --------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="admin-card max-w-3xl w-full relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-3 text-center text-turquoise">
          Request Details
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : !details ? (
          <p className="text-center text-gray-400">Request not found.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div><strong>Ticket:</strong> {details.ticket_code}</div>
            <div><strong>Status:</strong> {details.status}</div>
            <div>
              <strong>Created:</strong>{" "}
              {new Date(details.created_at).toLocaleString()}
            </div>

            {details.admin_email && (
              <div>
                <strong>Processed By:</strong> {details.admin_email}
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-semibold mb-1">Form Data:</h3>
              {renderPayload(details.payload)}
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Attachments:</h3>
                <ul className="space-y-2 mt-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span className="text-sm">{f.filename}</span>
                
                      <button
                        className="text-turquoise text-sm"
                        onClick={() => window.open(f.path, "_blank")}
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canDownloadFiles && (
              <div className="flex justify-end mt-6">
                <button
                onClick={async () => {
                  try {
                    const res = await apiClient.get(
                      `/admin/requests/${request.id}/download`,
                      {
                        responseType: "blob",
                        withCredentials: true,
                        headers: { "x-iranconnect-admin": "true" },
                      }
                    );
                
                    const url = window.URL.createObjectURL(res.data);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${details.ticket_code}.zip`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                
                  } catch (err) {
                    console.error(err);
                    alert("Download failed");
                  }
                }}
                className="admin-btn admin-btn-primary text-sm px-4 py-2"
              >
                Download Files
                </button>
              </div>
            )}

            {/* ✳️ Admin Decision */}
            {canProcessRequest ? (
              <>
                {errorMsg && (
                  <p className="text-red-500 text-xs text-center">{errorMsg}</p>
                )}

                {showApproveBox ? (
                  <DecisionBox
                    note={note}
                    setNote={setNote}
                    onCancel={() => {
                      setShowApproveBox(false);
                      setNote("");
                      setErrorMsg("");
                    }}
                    onConfirm={() => handleAction("approved")}
                    confirmLabel="Confirm Approve"
                  />
                ) : showRejectBox ? (
                  <DecisionBox
                    note={note}
                    setNote={setNote}
                    onCancel={() => {
                      setShowRejectBox(false);
                      setNote("");
                      setErrorMsg("");
                    }}
                    onConfirm={() => handleAction("rejected")}
                    confirmLabel="Save Decision"
                    danger
                  />
                ) : (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={() => {
                        setShowRejectBox(true);
                        setShowApproveBox(false);
                        setNote("");
                      }}
                    >
                      Reject
                    </button>

                    {isPendingNewRequest &&
                    !isNewRequestFulfilled ? (
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => {
                          window.location.href =
                            `/admin/add-v2?requestId=${details.id}`;
                        }}
                      >
                        Add Business
                      </button>
                    ) : (
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => {
                          setShowApproveBox(true);
                          setShowRejectBox(false);
                          setNote("");
                        }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center mt-6 text-gray-400 text-sm">
                {isActionable &&
                  !canProcessRequest && (
                    <p>
                      SuperAdmin access is required to process
                      update or delete business requests.
                    </p>
                  )}

                {details.status === "approved" && <p>✅ This request has been approved.</p>}
                {details.status === "rejected" && (
                  <div>
                    <p>❌ This request was rejected.</p>
                    {details.admin_note && (
                      <p className="italic text-xs text-gray-400 mt-2">
                        Note from admin: {details.admin_note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   🔁 Shared Decision Box
--------------------------------------------------------- */
function DecisionBox({ note, setNote, onCancel, onConfirm, confirmLabel, danger }) {
  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="admin-input min-h-[100px]"
        placeholder="Enter admin note..."
      />
      <div className="flex justify-end gap-3 mt-3">
        <button className="admin-btn admin-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`admin-btn admin-btn-primary ${danger ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
