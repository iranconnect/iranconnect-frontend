import { useEffect, useState } from "react";
import Link from "next/link";
import Pagination from "../ui/Pagination";
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

export default function ContactRequestsTab() {
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
    <section aria-label="Contact Requests">
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

      {loading && (
        <p role="status">Loading contact requests...</p>
      )}

      {error && (
        <div role="alert" className="mb-4">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="underline mt-2"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p role="status">
          No contact requests found.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-3">Subject</th>
                <th scope="col" className="p-3">Date</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr key={request.id} className="border-b">
                  <td className="p-3">
                    {SUBJECT_LABELS[request.subject_type] ||
                      request.subject_type}
                  </td>
                  <td className="p-3">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="p-3">
                    {request.status || "pending"}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="underline text-turquoise"
                      onClick={() => setSelected(request)}
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
