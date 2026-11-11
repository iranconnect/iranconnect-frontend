import { useEffect, useState } from "react";
import Link from "next/link";
import Pagination from "../ui/Pagination";
import RequestHistoryTable, {
  RequestStatusBadge,
} from "./RequestHistoryTable";
import apiClient from "../../utils/apiClient";

const PAGE_SIZE = 10;

const SUBJECT_LABELS = {
  business_ownership_dispute: "Business Ownership Dispute",
  account_access_issue: "Account Access Issue",
  business_request_issue: "Business Request Issue",
  unblock_request: "Request Account Unblock",
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  from: 0,
  to: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB");
}

export default function ContactRequestsTab({ theme = "light" }) {
  const dark = theme === "dark";

  const cardStyle = {
    backgroundColor: dark ? "#0b2149" : "#ffffff",
    color: dark ? "#ffffff" : "#0a1b2a",
    borderColor: dark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)",
  };

  const innerStyle = {
    backgroundColor: dark ? "#102b5b" : "#f8fafc",
    borderColor: dark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)",
  };

  const statusStyle = (status) => {
    const normalized = String(status || "pending").toLowerCase();

    if (["approved", "resolved", "completed"].includes(normalized)) {
      return "bg-green-100 text-green-700";
    }
    if (["rejected", "closed"].includes(normalized)) {
      return "bg-red-100 text-red-700";
    }
    return "bg-yellow-100 text-yellow-800";
  };
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] =
    useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadRequests() {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get(
          "/contact/my-requests",
          {
            params: { page, limit: PAGE_SIZE },
            withCredentials: true,
            signal: controller.signal,
          }
        );

        if (!active) return;

        if (
          !Array.isArray(response.data?.rows) ||
          !response.data?.pagination
        ) {
          throw new Error("Invalid support history response");
        }

        setRows(response.data.rows);
        setPagination(response.data.pagination);
      } catch (err) {
        if (!active) return;

        setRows([]);
        setPagination(EMPTY_PAGINATION);
        setError(
          "Unable to load contact requests. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, reloadKey]);

  return (
    <section
      aria-label="Contact Requests"
      className="rounded-2xl border p-4 sm:p-6"
      style={cardStyle}
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold">
          My Contact Requests
        </h2>

        <Link
          href="/account/contact-support"
          className="inline-flex items-center justify-center rounded-lg border border-turquoise px-4 py-2 text-sm font-semibold text-turquoise"
        >
          Contact Support
        </Link>
      </div>

      <RequestHistoryTable
        rows={rows}
        theme={theme}
        loading={loading}
        error={error}
        emptyMessage="No contact requests found."
        getRowKey={(request) => request.id}
        columns={[
          {
            key: "subject",
            label: "Subject",
            className: "px-4 py-3 font-semibold text-turquoise",
            render: (request) =>
              SUBJECT_LABELS[request.subject_type] ||
              request.subject_type,
          },
          {
            key: "created",
            label: "Created",
            render: (request) => formatDate(request.created_at),
          },
          {
            key: "status",
            label: "Status",
            render: (request) => (
              <RequestStatusBadge
                status={request.status}
                getStatusClass={statusStyle}
              />
            ),
          },
          {
            key: "view",
            label: "View",
            render: (request) => (
              <button
                type="button"
                onClick={() => setSelected(request)}
                className="text-turquoise font-medium hover:underline"
              >
                View
              </button>
            ),
          },
        ]}
        renderMobileCard={(request) => (
          <>
            <h3 className="text-lg font-semibold text-turquoise mb-1">
              {SUBJECT_LABELS[request.subject_type] ||
                request.subject_type}
            </h3>

            <p className="text-sm mb-2">
              Created: {formatDate(request.created_at)}
            </p>

            <div className="mb-2">
              <RequestStatusBadge
                status={request.status}
                getStatusClass={statusStyle}
              />
            </div>

            <button
              type="button"
              onClick={() => setSelected(request)}
              className="text-turquoise font-medium mt-1 hover:underline"
            >
              View
            </button>
          </>
        )}
      />

      {!loading && !error && (
        <div className="mt-5">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-request-details-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 text-gray-900"
          >
            <h3
              id="contact-request-details-title"
              className="text-xl font-semibold mb-4"
            >
              Contact Request Details
            </h3>

            <p className="mb-2">
              <strong>Subject:</strong>{" "}
              {SUBJECT_LABELS[selected.subject_type] ||
                selected.subject_type}
            </p>
            <p className="mb-2">
              <strong>Status:</strong>{" "}
              {selected.status || "pending"}
            </p>
            <p className="mb-2">
              <strong>Submitted:</strong>{" "}
              {formatDate(selected.created_at)}
            </p>

            <p className="font-semibold mt-4 mb-2">
              Your message
            </p>
            <p className="whitespace-pre-wrap break-words">
              {selected.message}
            </p>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn-primary mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
