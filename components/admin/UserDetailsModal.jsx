// frontend/components/admin/UserDetailsModal.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../../utils/apiClient";
import { useAuthSession } from "../../hooks/useAuthSession";
import UserAdministrativeActionModal from "./UserAdministrativeActionModal";
import Pagination from "../ui/Pagination";

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString();
}

function formatAdminActionLabel(
  actionType
) {
  const labels = {
    "user.block": "Block",
    "user.unblock": "Unblock",
    "user.change_role": "Change Role",
    "user.send_email": "Send Email",
    "user.delete": "Delete",
  };

  return (
    labels[actionType] ||
    actionType ||
    "Not recorded"
  );
}

function formatAuditResult(result) {
  if (!result) {
    return "Not recorded";
  }

  return (
    result.charAt(0).toUpperCase() +
    result.slice(1)
  );
}

const ADMIN_HISTORY_PAGE_SIZE = 20;

const DEFAULT_ADMIN_HISTORY_PAGINATION = {
  page: 1,
  limit: ADMIN_HISTORY_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export default function UserDetailsModal({
  user,
  onClose,
  onUpdated,
}) {
  const mountedRef = useRef(true);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const {
    role: currentRole,
    user: currentSessionUser,
  } = useAuthSession();

  const displayEmail =
    details?.display_email ||
    details?.email ||
    user?.display_email ||
    user?.email ||
    null;

  const isCurrentSessionAccount =
    Boolean(
      currentSessionUser?.email &&
      displayEmail &&
      currentSessionUser.email
        .trim()
        .toLowerCase() ===
        displayEmail
          .trim()
          .toLowerCase()
    );

  const [
    emailActionModalOpen,
    setEmailActionModalOpen,
  ] = useState(false);

  const [emailBody, setEmailBody] =
    useState("");

  const [emailSubject, setEmailSubject] =
    useState("");

  const [sendingEmail, setSendingEmail] =
    useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [
    blockActionModalOpen,
    setBlockActionModalOpen,
  ] = useState(false);

  const [
    roleActionModalOpen,
    setRoleActionModalOpen,
  ] = useState(false);

  const [
    requestedRole,
    setRequestedRole,
  ] = useState("");

  const [
    deleteActionModalOpen,
    setDeleteActionModalOpen,
  ] = useState(false);

  const [
    deleteConfirmationEmail,
    setDeleteConfirmationEmail,
  ] = useState("");

  const [
    administrativeHistory,
    setAdministrativeHistory,
  ] = useState([]);

  const [
    historyPagination,
    setHistoryPagination,
  ] = useState(
    DEFAULT_ADMIN_HISTORY_PAGINATION
  );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const historyRequestIdRef =
    useRef(0);

  const [
    expandedHistoryId,
    setExpandedHistoryId,
  ] = useState(null);

  /* ----------------------------------------------------
     🧹 Prevent state update after unmount
  ---------------------------------------------------- */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ----------------------------------------------------
     🧩 Fetch user details
  ---------------------------------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    fetchDetails();
  }, [user]);

  useEffect(() => {
    if (
      currentRole !== "superadmin" ||
      !user?.id
    ) {
      setAdministrativeHistory([]);
      setHistoryPagination(
        DEFAULT_ADMIN_HISTORY_PAGINATION
      );
      setHistoryError("");
    }
  }, [currentRole, user]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setErrorMsg("");

    try {
      const res = await apiClient.get(`/admin/users/${user.id}`, {
        withCredentials: true,
      });
      if (mountedRef.current) setDetails(res.data);
    } catch (err) {
      if (!mountedRef.current) return;

      if (err.response?.status === 403) {
        setForbidden(true);
        setErrorMsg("⚠️ You are not authorized to view this user's details.");
      } else {
        setErrorMsg("Failed to load user details.");
      }
      setDetails(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  const fetchAdministrativeHistory =
    useCallback(
      async (requestedPage = 1) => {
        if (
          currentRole !== "superadmin" ||
          !user?.id
        ) {
          return;
        }

        const requestId =
          historyRequestIdRef.current +
          1;

        historyRequestIdRef.current =
          requestId;

        setHistoryLoading(true);
        setHistoryError("");

        try {
          const response =
            await apiClient.get(
              `/admin/users/${user.id}/administrative-history`,
              {
                params: {
                  page: requestedPage,
                  limit:
                    ADMIN_HISTORY_PAGE_SIZE,
                },
                withCredentials: true,
              }
            );

          if (
            requestId !==
              historyRequestIdRef.current ||
            !mountedRef.current
          ) {
            return;
          }

          setAdministrativeHistory(
            response.data?.history || []
          );

          setHistoryPagination({
            ...DEFAULT_ADMIN_HISTORY_PAGINATION,
            ...(response.data
              ?.pagination || {}),
          });
        } catch (err) {
          if (
            requestId !==
              historyRequestIdRef.current ||
            !mountedRef.current
          ) {
            return;
          }

          setAdministrativeHistory([]);

          setHistoryPagination(
            DEFAULT_ADMIN_HISTORY_PAGINATION
          );

          setHistoryError(
            err.response?.data?.error ||
              "Failed to load administrative history."
          );
        } finally {
          if (
            requestId ===
              historyRequestIdRef.current &&
            mountedRef.current
          ) {
            setHistoryLoading(false);
          }
        }
      },
      [currentRole, user]
    );

  useEffect(() => {
    if (
      currentRole === "superadmin" &&
      user?.id
    ) {
      fetchAdministrativeHistory(1);
    }
  }, [
    currentRole,
    user,
    fetchAdministrativeHistory,
  ]);

  const refreshAdministrativeHistory =
    useCallback(async () => {
      if (
        currentRole !== "superadmin"
      ) {
        return;
      }

      await fetchAdministrativeHistory(
        historyPagination.page || 1
      );
    }, [
      currentRole,
      fetchAdministrativeHistory,
      historyPagination.page,
    ]);

  const handleHistoryPageChange =
    useCallback(
      (nextPage) => {
        if (
          historyLoading ||
          currentRole !== "superadmin"
        ) {
          return;
        }

        fetchAdministrativeHistory(
          nextPage
        );
      },
      [
        historyLoading,
        currentRole,
        fetchAdministrativeHistory,
      ]
    );

  /* ----------------------------------------------------
     🔒 Block / Unblock User
  ---------------------------------------------------- */
  const openBlockActionModal =
    useCallback(() => {
      if (
        actionLoading ||
        forbidden ||
        !details
      ) {
        return;
      }

      setBlockActionModalOpen(true);
    }, [
      actionLoading,
      forbidden,
      details,
    ]);

  const confirmBlockAction =
    useCallback(
      async (adminNote) => {
        if (
          actionLoading ||
          forbidden ||
          !details
        ) {
          return;
        }

        const wasBlocked =
          details.is_blocked;

        setActionLoading(true);

        try {
          await apiClient.patch(
            `/admin/users/${user.id}/block`,
            {
              admin_note: adminNote,
            },
            {
              withCredentials: true,
            }
          );

          if (mountedRef.current) {
            setBlockActionModalOpen(
              false
            );
          }

          alert(
            `✅ User ${
              wasBlocked
                ? "unblocked"
                : "blocked"
            } successfully`
          );

          await fetchDetails();
          await refreshAdministrativeHistory();
          await onUpdated?.();
        } catch (err) {
          if (
            err.response?.status === 403
          ) {
            setForbidden(true);
            setBlockActionModalOpen(
              false
            );
            alert("⛔ Not authorized.");
          } else {
            const message =
              err.response?.data
                ?.error ||
              "Failed to update user status";

            alert(`❌ ${message}`);
          }
        } finally {
          if (mountedRef.current) {
            setActionLoading(false);
          }
        }
      },
      [
        actionLoading,
        forbidden,
        details,
        user,
        fetchDetails,
        refreshAdministrativeHistory,
        onUpdated,
      ]
    );
  /* ----------------------------------------------------
     👑 Change Role (SuperAdmin Only)
  ---------------------------------------------------- */
  const openRoleActionModal =
    useCallback(() => {
      if (
        currentRole !== "superadmin" ||
        actionLoading ||
        forbidden ||
        !details
      ) {
        return;
      }

      setRequestedRole("");
      setRoleActionModalOpen(true);
    }, [
      currentRole,
      actionLoading,
      forbidden,
      details,
    ]);

  const confirmRoleChange =
    useCallback(
      async (adminNote) => {
        if (
          currentRole !== "superadmin" ||
          actionLoading ||
          forbidden ||
          !details ||
          !requestedRole
        ) {
          return;
        }

        setActionLoading(true);

        try {
          await apiClient.patch(
            `/admin/users/${user.id}/role`,
            {
              role: requestedRole,
              admin_note: adminNote,
            },
            {
              withCredentials: true,
            }
          );

          if (mountedRef.current) {
            setRoleActionModalOpen(
              false
            );
            setRequestedRole("");
          }

          alert(
            `✅ Role changed to ${requestedRole}`
          );

          await fetchDetails();
          await refreshAdministrativeHistory();
          await onUpdated?.();
        } catch (err) {
          if (
            err.response?.status === 403
          ) {
            setForbidden(true);
            setRoleActionModalOpen(
              false
            );
            alert("⛔ Not authorized.");
          } else {
            const message =
              err.response?.data
                ?.error ||
              "Failed to change role";

            alert(`❌ ${message}`);
          }
        } finally {
          if (mountedRef.current) {
            setActionLoading(false);
          }
        }
      },
      [
        currentRole,
        actionLoading,
        forbidden,
        details,
        requestedRole,
        user,
        fetchDetails,
        refreshAdministrativeHistory,
        onUpdated,
      ]
    );

  /* ----------------------------------------------------
     🗑 Delete User (SuperAdmin Only)
  ---------------------------------------------------- */
  const openDeleteActionModal =
    useCallback(() => {
      if (
        currentRole !== "superadmin" ||
        actionLoading ||
        forbidden ||
        !details
      ) {
        return;
      }

      setDeleteConfirmationEmail("");
      setDeleteActionModalOpen(true);
    }, [
      currentRole,
      actionLoading,
      forbidden,
      details,
    ]);

  const confirmDeleteUser =
    useCallback(
      async (adminNote) => {
        if (
          currentRole !== "superadmin" ||
          actionLoading ||
          forbidden ||
          !details
        ) {
          return;
        }

        const confirmationEmail =
          deleteConfirmationEmail.trim();

        if (
          confirmationEmail !==
          details.email
        ) {
          alert(
            "Confirmation email does not match the target user."
          );
          return;
        }

        setActionLoading(true);

        try {
          await apiClient.delete(
            `/admin/users/${user.id}`,
            {
              withCredentials: true,
              data: {
                admin_note: adminNote,
                confirmation_email:
                  confirmationEmail,
              },
            }
          );

          if (mountedRef.current) {
            setDeleteActionModalOpen(
              false
            );
            setDeleteConfirmationEmail(
              ""
            );
          }

          alert(
            "🗑️ User deleted successfully"
          );

          await onUpdated?.();
          onClose();
        } catch (err) {
          if (
            err.response?.status === 403
          ) {
            setForbidden(true);
            setDeleteActionModalOpen(
              false
            );
            alert("⛔ Not authorized.");
          } else {
            const message =
              err.response?.data
                ?.error ||
              "Failed to delete user";

            alert(`❌ ${message}`);
          }
        } finally {
          if (mountedRef.current) {
            setActionLoading(false);
          }
        }
      },
      [
        currentRole,
        actionLoading,
        forbidden,
        details,
        deleteConfirmationEmail,
        user,
        onClose,
        onUpdated,
      ]
    );

  /* ----------------------------------------------------
     ✉️ Send Email (SuperAdmin Only)
  ---------------------------------------------------- */
  const openEmailActionModal =
    useCallback(() => {
      if (
        currentRole !== "superadmin" ||
        forbidden ||
        sendingEmail
      ) {
        return;
      }

      setEmailActionModalOpen(true);
    }, [
      currentRole,
      forbidden,
      sendingEmail,
    ]);

  const confirmSendEmail =
    useCallback(
      async (adminNote) => {
        if (
          currentRole !== "superadmin" ||
          sendingEmail ||
          forbidden
        ) {
          return;
        }

        const subject =
          emailSubject.trim();

        const message =
          emailBody.trim();

        if (!subject || !message) {
          alert(
            "Please enter subject and message."
          );
          return;
        }

        setSendingEmail(true);

        try {
          await apiClient.post(
            `/admin/users/${user.id}/send-email`,
            {
              subject,
              message,
              admin_note: adminNote,
            },
            {
              withCredentials: true,
            }
          );

          if (mountedRef.current) {
            setEmailActionModalOpen(
              false
            );
            setEmailSubject("");
            setEmailBody("");
          }

          alert(
            "✅ Email sent successfully"
          );

          await fetchDetails();
          await refreshAdministrativeHistory();
          await onUpdated?.();
        } catch (err) {
          if (
            err.response?.status === 403
          ) {
            setForbidden(true);
            setEmailActionModalOpen(
              false
            );
            alert("⛔ Not authorized.");
          } else {
            const responseMessage =
              err.response?.data
                ?.error ||
              "Failed to send email";

            alert(
              `❌ ${responseMessage}`
            );
          }
        } finally {
          if (mountedRef.current) {
            setSendingEmail(false);
          }
        }
      },
      [
        currentRole,
        sendingEmail,
        forbidden,
        emailSubject,
        emailBody,
        user,
        fetchDetails,
        refreshAdministrativeHistory,
        onUpdated,
      ]
    );

  /* ----------------------------------------------------
     🧠 ESC handling (safe)
  ---------------------------------------------------- */
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape") {
        return;
      }

      /*
       * Child administrative action modals own their own
       * Escape handling. Do not close the parent details
       * modal while one of them is open.
       */
      if (
        blockActionModalOpen ||
        roleActionModalOpen ||
        emailActionModalOpen ||
        deleteActionModalOpen
      ) {
        return;
      }

      onClose();
    };

    window.addEventListener(
      "keydown",
      onEsc
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onEsc
      );
  }, [
    blockActionModalOpen,
    roleActionModalOpen,
    emailActionModalOpen,
    deleteActionModalOpen,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="admin-card max-w-2xl w-full relative max-h-[90vh] flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-turquoise text-lg font-bold"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-turquoise">
          User Details
        </h2>

        <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : errorMsg ? (
          <p className="text-center text-red-500">{errorMsg}</p>
        ) : !details ? (
          <p className="text-center text-gray-400">User not found.</p>
        ) : (
          <>
            {/* User Information */}
            <section>
              <h3 className="text-base font-semibold text-turquoise mb-3">
                User Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong>{" "}
                  <span className="break-all">
                    {displayEmail ||
                      "Not recorded"}
                  </span>
                </div>

                <div>
                  <strong>Role:</strong>{" "}
                  {details.role}
                </div>

                <div>
                  <strong>Verified:</strong>{" "}
                  {details.is_verified
                    ? "Yes"
                    : "No"}
                </div>

                <div>
                  <strong>Created:</strong>{" "}
                  {formatDateTime(
                    details.created_at
                  )}
                </div>

                <div>
                  <strong>Last Login:</strong>{" "}
                  {formatDateTime(
                    details.last_login_at
                  )}
                </div>

                <div>
                  <strong>Verified businesses:</strong>{" "}
                  {details.business_count ?? 0}
                </div>

                <div>
                  <strong>Reviews:</strong>{" "}
                  {details.rating_count ?? 0}
                </div>
              </div>
            </section>

            {/* Current Account Status */}
            <section className="mt-6 pt-5 border-t border-white/10">
              <h3 className="text-base font-semibold text-turquoise mb-3">
                Current Account Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Status:</strong>{" "}
                  {details.current_account_status
                    ?.is_deleted
                    ? "Deleted"
                    : details.current_account_status
                        ?.is_blocked
                      ? "Blocked"
                      : "Active"}
                </div>

                <div>
                  <strong>Suspension source:</strong>{" "}
                  {details.current_account_status
                    ?.is_blocked
                    ? details
                        .current_account_status
                        ?.block_source ||
                      "Unknown / Legacy"
                    : "—"}
                </div>

                <div>
                  <strong>Suspension reason:</strong>{" "}
                  {details.current_account_status
                    ?.is_blocked
                    ? details
                        .current_account_status
                        ?.block_reason_code ||
                      "Not recorded"
                    : "—"}
                </div>

                <div>
                  <strong>Blocked at:</strong>{" "}
                  {details.current_account_status
                    ?.is_blocked
                    ? formatDateTime(
                        details
                          .current_account_status
                          ?.blocked_at
                      )
                    : "—"}
                </div>

                {details.current_account_status
                  ?.is_deleted && (
                  <>
                    <div>
                      <strong>Deleted at:</strong>{" "}
                      {formatDateTime(
                        details
                          .current_account_status
                          ?.deleted_at
                      )}
                    </div>

                    <div>
                      <strong>Deletion reason:</strong>{" "}
                      {details
                        .current_account_status
                        ?.deleted_reason ||
                        "Not recorded"}
                    </div>

                    <div>
                      <strong>Anonymized at:</strong>{" "}
                      {formatDateTime(
                        details
                          .current_account_status
                          ?.anonymized_at
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Latest Administrative Context */}
            <section className="mt-6 pt-5 border-t border-white/10">
              <h3 className="text-base font-semibold text-turquoise mb-3">
                Latest Administrative Context
              </h3>

              {details.latest_administrative_context ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Action:</strong>{" "}
                    {formatAdminActionLabel(
                      details
                        .latest_administrative_context
                        .canonical_action_type
                    )}
                  </div>

                  <div>
                    <strong>Result:</strong>{" "}
                    {formatAuditResult(
                      details
                        .latest_administrative_context
                        .result
                    )}
                  </div>

                  <div>
                    <strong>Actor:</strong>{" "}
                    <span className="break-all">
                      {details
                        .latest_administrative_context
                        .actor?.email ||
                        "Not recorded"}
                    </span>
                  </div>

                  <div>
                    <strong>Actor role:</strong>{" "}
                    {details
                      .latest_administrative_context
                      .actor?.role ||
                      "Not recorded"}
                  </div>

                  <div>
                    <strong>Recorded at:</strong>{" "}
                    {formatDateTime(
                      details
                        .latest_administrative_context
                        .created_at
                    )}
                  </div>

                  <div>
                    <strong>Request ID:</strong>{" "}
                    <span className="break-all">
                      {details
                        .latest_administrative_context
                        .request_id ||
                        "Not recorded"}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <strong>Admin note:</strong>
                    <div className="mt-1 whitespace-pre-wrap break-words opacity-90">
                      {details
                        .latest_administrative_context
                        .admin_note ||
                        "Not recorded"}
                    </div>
                  </div>

                  {details
                    .latest_administrative_context
                    .failure_reason && (
                    <div className="sm:col-span-2">
                      <strong>Failure reason:</strong>
                      <div className="mt-1 whitespace-pre-wrap break-words text-red-500">
                        {
                          details
                            .latest_administrative_context
                            .failure_reason
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm opacity-70">
                  No administrative history has been recorded for this user.
                </p>
              )}
            </section>

            {currentRole === "superadmin" && (
              <section className="mt-6 pt-5 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-turquoise">
                    Administrative History
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      fetchAdministrativeHistory(
                        historyPagination.page ||
                          1
                      )
                    }
                    disabled={historyLoading}
                    className="admin-btn admin-btn-secondary text-sm disabled:opacity-60"
                  >
                    {historyLoading
                      ? "Refreshing..."
                      : "Refresh"}
                  </button>
                </div>

                {historyError ? (
                  <p className="text-sm text-red-500">
                    {historyError}
                  </p>
                ) : historyLoading &&
                  administrativeHistory.length ===
                    0 ? (
                  <p className="text-sm opacity-70">
                    Loading administrative history...
                  </p>
                ) : administrativeHistory.length ===
                  0 ? (
                  <p className="text-sm opacity-70">
                    No administrative history has been recorded for this user.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {administrativeHistory.map(
                        (entry) => {
                          const expanded =
                            expandedHistoryId ===
                            entry.id;

                          return (
                            <article
                              key={entry.id}
                              className="rounded-lg border border-[var(--border)] overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedHistoryId(
                                    expanded
                                      ? null
                                      : entry.id
                                  )
                                }
                                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-[var(--bg)]/50 transition"
                                aria-expanded={
                                  expanded
                                }
                              >
                                <span className="font-semibold">
                                  {formatAdminActionLabel(
                                    entry
                                      .canonical_action_type
                                  )}
                                </span>

                                <span className="text-sm opacity-70 whitespace-nowrap">
                                  {formatDateTime(
                                    entry.created_at
                                  )}
                                  {" · "}
                                  {formatAuditResult(
                                    entry.result
                                  )}
                                </span>
                              </button>

                              {expanded && (
                                <div className="border-t border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <strong>Actor:</strong>{" "}
                                    <span className="break-all">
                                      {entry.actor?.email ||
                                        "Not recorded"}
                                    </span>
                                  </div>

                                  <div>
                                    <strong>Actor role:</strong>{" "}
                                    {entry.actor?.role ||
                                      "Not recorded"}
                                  </div>

                                  <div>
                                    <strong>Raw action:</strong>{" "}
                                    <code className="text-xs">
                                      {entry.raw_action_type ||
                                        "Not recorded"}
                                    </code>
                                  </div>

                                  <div>
                                    <strong>Role change:</strong>{" "}
                                    {entry.target
                                      ?.role_before ||
                                      "—"}
                                    {" → "}
                                    {entry.target
                                      ?.role_after ||
                                      "—"}
                                  </div>

                                  <div className="sm:col-span-2">
                                    <strong>Admin note:</strong>
                                    <div className="mt-1 whitespace-pre-wrap break-words">
                                      {entry.admin_note ||
                                        "Not recorded"}
                                    </div>
                                  </div>

                                  {entry.failure_reason && (
                                    <div className="sm:col-span-2">
                                      <strong>
                                        Failure reason:
                                      </strong>
                                      <div className="mt-1 text-red-500 whitespace-pre-wrap">
                                        {
                                          entry.failure_reason
                                        }
                                      </div>
                                    </div>
                                  )}

                                  <div className="sm:col-span-2">
                                    <strong>Request ID:</strong>{" "}
                                    <span className="break-all text-xs">
                                      {entry.request_id ||
                                        "Not recorded"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>

                    <Pagination
                      pagination={
                        historyPagination
                      }
                      onPageChange={
                        handleHistoryPageChange
                      }
                      disabled={
                        historyLoading
                      }
                    />
                  </>
                )}
              </section>
            )}

          </>
        )}
        </div>

        {details &&
          !forbidden &&
          !details.current_account_status
            ?.is_deleted && (
            <div className="shrink-0 -mx-6 -mb-6 mt-0 px-6 py-4 border-t border-[var(--border)] bg-[var(--card-bg)]">
              {isCurrentSessionAccount ? (
                <div className="text-sm text-center px-4 py-3 rounded-lg border border-[var(--turquoise)] text-[var(--text)] bg-[var(--bg)] leading-relaxed">
                  <span className="block">
                    No administrative actions are available for this account
                  </span>
                  <span className="block">
                    because you are currently signed in with it.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-end">
                  {currentRole ===
                    "superadmin" && (
                    <button
                      type="button"
                      onClick={
                        openRoleActionModal
                      }
                      className="admin-btn admin-btn-primary"
                      disabled={
                        actionLoading
                      }
                    >
                      Change Role
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={
                      openBlockActionModal
                    }
                    className="admin-btn admin-btn-primary"
                    disabled={
                      actionLoading
                    }
                  >
                    {details.is_blocked
                      ? "Unblock"
                      : "Block"}
                  </button>

                  {currentRole ===
                    "superadmin" && (
                    <button
                      type="button"
                      onClick={
                        openEmailActionModal
                      }
                      className="admin-btn admin-btn-primary"
                      disabled={
                        sendingEmail
                      }
                    >
                      Send Email
                    </button>
                  )}

                  {currentRole ===
                    "superadmin" && (
                    <button
                      type="button"
                      onClick={
                        openDeleteActionModal
                      }
                      className="admin-btn admin-btn-danger"
                      disabled={
                        actionLoading
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        <UserAdministrativeActionModal
          open={roleActionModalOpen}
          title="Change User Role"
          actionLabel="Change Role"
          targetLabel={
            displayEmail ||
            `User #${user?.id}`
          }
          description="Select the new role and provide the required administrative note. This change will be recorded in the audit history."
          contextItems={[
            {
              key: "current-role",
              label: "Current role",
              value:
                details?.role ||
                "—",
            },
          ]}
          confirmLabel="Confirm Role Change"
          loading={actionLoading}
          onClose={() => {
            setRoleActionModalOpen(
              false
            );
            setRequestedRole("");
          }}
          onConfirm={
            confirmRoleChange
          }
        >
          <div>
            <label
              htmlFor="user-role-select"
              className="block text-sm font-semibold mb-2"
            >
              New role *
            </label>

            <select
              id="user-role-select"
              value={requestedRole}
              onChange={(event) =>
                setRequestedRole(
                  event.target.value
                )
              }
              className="admin-input w-full"
              disabled={actionLoading}
              required
            >
              <option value="">
                Select a role
              </option>

              <option
                value="user"
                disabled={
                  details?.role ===
                  "user"
                }
              >
                User
              </option>

              <option
                value="admin"
                disabled={
                  details?.role ===
                  "admin"
                }
              >
                Admin
              </option>

              <option
                value="superadmin"
                disabled={
                  details?.role ===
                  "superadmin"
                }
              >
                SuperAdmin
              </option>
            </select>
          </div>
        </UserAdministrativeActionModal>

        <UserAdministrativeActionModal
          open={blockActionModalOpen}
          title={
            details?.is_blocked
              ? "Unblock User"
              : "Block User"
          }
          actionLabel={
            details?.is_blocked
              ? "Unblock"
              : "Block"
          }
          targetLabel={
            displayEmail ||
            `User #${user?.id}`
          }
          description={
            details?.is_blocked
              ? "Restore access for this user. The administrative note will be recorded in the audit history."
              : "Suspend access for this user. Active sessions will be revoked and the administrative note will be recorded in the audit history."
          }
          contextItems={[
            {
              key: "current-status",
              label: "Current status",
              value:
                details?.is_blocked
                  ? "Blocked"
                  : "Active",
            },
            {
              key: "role",
              label: "Role",
              value:
                details?.role ||
                "—",
            },
          ]}
          confirmLabel={
            details?.is_blocked
              ? "Confirm Unblock"
              : "Confirm Block"
          }
          danger={
            !details?.is_blocked
          }
          loading={actionLoading}
          onClose={() =>
            setBlockActionModalOpen(
              false
            )
          }
          onConfirm={
            confirmBlockAction
          }
        />

        <UserAdministrativeActionModal
          open={deleteActionModalOpen}
          title="Delete User"
          actionLabel="Delete"
          targetLabel={
            displayEmail ||
            `User #${user?.id}`
          }
          description="This action soft-deletes and anonymizes the account, revokes active access, invalidates reset material, and records the administrative action. The user ID and required audit history are preserved."
          contextItems={[
            {
              key: "role",
              label: "Role",
              value:
                details?.role ||
                "—",
            },
            {
              key: "current-status",
              label: "Current status",
              value:
                details?.is_blocked
                  ? "Blocked"
                  : "Active",
            },
          ]}
          confirmLabel="Delete User"
          danger
          loading={actionLoading}
          onClose={() => {
            setDeleteActionModalOpen(
              false
            );
            setDeleteConfirmationEmail(
              ""
            );
          }}
          onConfirm={
            confirmDeleteUser
          }
        >
          <div>
            <label
              htmlFor="delete-user-confirmation-email"
              className="block text-sm font-semibold mb-2"
            >
              Type the user email to confirm *
            </label>

            <input
              id="delete-user-confirmation-email"
              value={
                deleteConfirmationEmail
              }
              onChange={(event) =>
                setDeleteConfirmationEmail(
                  event.target.value
                )
              }
              className="admin-input w-full"
              placeholder={
                details?.email ||
                user?.email ||
                "User email"
              }
              disabled={actionLoading}
              autoComplete="off"
              required
            />

            <p className="mt-2 text-xs opacity-80 break-all">
              Required exact value:{" "}
              <strong>
                {details?.email ||
                  user?.email ||
                  "—"}
              </strong>
            </p>

            {deleteConfirmationEmail &&
              deleteConfirmationEmail.trim() !==
                details?.email && (
                <p className="mt-2 text-xs text-red-500">
                  Email confirmation does not match.
                </p>
              )}
          </div>
        </UserAdministrativeActionModal>

        <UserAdministrativeActionModal
          open={emailActionModalOpen}
          title="Send Email"
          actionLabel="Send Email"
          targetLabel={
            displayEmail ||
            `User #${user?.id}`
          }
          description="Send an email to this user and provide the required administrative note. The email body itself is not duplicated into the administrative audit history."
          contextItems={[
            {
              key: "role",
              label: "Role",
              value:
                details?.role ||
                "—",
            },
          ]}
          confirmLabel="Send Email"
          loading={sendingEmail}
          onClose={() => {
            setEmailActionModalOpen(
              false
            );
            setEmailSubject("");
            setEmailBody("");
          }}
          onConfirm={
            confirmSendEmail
          }
        >
          <div className="space-y-3">
            <div>
              <label
                htmlFor="user-email-subject"
                className="block text-sm font-semibold mb-2"
              >
                Subject *
              </label>

              <input
                id="user-email-subject"
                value={emailSubject}
                onChange={(event) =>
                  setEmailSubject(
                    event.target.value
                  )
                }
                className="admin-input w-full"
                placeholder="Subject"
                disabled={sendingEmail}
                required
              />
            </div>

            <div>
              <label
                htmlFor="user-email-message"
                className="block text-sm font-semibold mb-2"
              >
                Message *
              </label>

              <textarea
                id="user-email-message"
                rows={6}
                value={emailBody}
                onChange={(event) =>
                  setEmailBody(
                    event.target.value
                  )
                }
                className="admin-input w-full resize-y"
                placeholder="Message"
                disabled={sendingEmail}
                required
              />
            </div>
          </div>
        </UserAdministrativeActionModal>
      </div>
    </div>
  );
}
