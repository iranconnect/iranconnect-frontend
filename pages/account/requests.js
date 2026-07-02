// frontend/pages/account/requests.js

import { useEffect, useMemo, useState } from "react";

import AccountLayout from "../../components/account/AccountLayout";
import Pagination from "../../components/ui/Pagination";
import usePaginationQuery from "../../hooks/usePaginationQuery";
import apiClient from "../../utils/apiClient";

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

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-GB");
}

function getStatusClass(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default function RequestHistory() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [draftFilters, setDraftFilters] = useState({
    business: "",
    ticket: "",
    created: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [selectedRequest, setSelectedRequest] =
    useState(null);

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
      "business",
      "ticket",
      "created",
    ],
    defaultLimit: 10,
  });

  useEffect(() => {
    const current =
      document.documentElement.getAttribute(
        "data-theme"
      ) || "light";

    setTheme(current);

    const observer = new MutationObserver(() => {
      const nextTheme =
        document.documentElement.getAttribute(
          "data-theme"
        ) || "light";

      setTheme(nextTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setDraftFilters({
      business: filters.business || "",
      ticket: filters.ticket || "",
      created: filters.created || "",
    });
  }, [
    isReady,
    filters.business,
    filters.ticket,
    filters.created,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    fetchRequests();
  }, [
    isReady,
    page,
    limit,
    filters.business,
    filters.ticket,
    filters.created,
  ]);

  async function fetchRequests() {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get("/requests", {
        withCredentials: true,

        params: {
          page,
          limit,
          business: filters.business || undefined,
          ticket: filters.ticket || undefined,
          created: filters.created || undefined,
        },
      });

      /*
        Backward compatibility:
        تا زمانی که Backend جدید Deploy نشده،
        endpoint فعلی Array برمی‌گرداند.
      */
      if (Array.isArray(res.data)) {
        const legacyRows = res.data.slice(0, 5);

        setRequests(legacyRows);

        setPagination({
          page: 1,
          limit: 5,
          total: legacyRows.length,
          totalPages: 1,
          from: legacyRows.length ? 1 : 0,
          to: legacyRows.length,
          hasPreviousPage: false,
          hasNextPage: false,
        });

        return;
      }

      setRequests(res.data?.rows || []);

      setPagination(
        res.data?.pagination ||
          DEFAULT_PAGINATION
      );
    } catch (err) {
      console.error(
        "Unable to load business requests:",
        err
      );

      setRequests([]);
      setPagination(DEFAULT_PAGINATION);

      setError(
        err.response?.data?.error ||
          "Unable to load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    applyFilters(draftFilters);
  }

  async function handleClear() {
    setDraftFilters({
      business: "",
      ticket: "",
      created: "",
    });
  
    await clearFilters();
  }

  const inputClass =
    "p-2 rounded-lg border border-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
    (theme === "dark"
      ? "bg-[#153b78] text-white placeholder-gray-300"
      : "bg-[#f5f7fa] text-gray-900 placeholder-gray-500");

  const cardStyle = {
    background: theme === "dark" ? "#0b2149" : "#ffffff",

    color:
      theme === "dark"
        ? "#ffffff"
        : "#0a1b2a",

    borderColor:
      theme === "dark"
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",

    boxShadow:
      theme === "dark"
        ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
        : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
  };

  const hasRows = requests.length > 0;

  const resultSummary = useMemo(() => {
    if (loading) {
      return null;
    }

    if (error) {
      return null;
    }

    if (!hasRows) {
      return "No matching requests found.";
    }

    return null;
  }, [
    loading,
    error,
    hasRows,
  ]);

  return (
    <AccountLayout>
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="w-full max-w-5xl mx-auto">
            <h1
              className="text-2xl font-bold text-center mb-8"
              style={{ color: "#000000" }}
            >
              📋 My Business Requests
            </h1>

            <div
              className="rounded-2xl p-6 border transition-all duration-300"
              style={cardStyle}
            >
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 items-end"
              >
                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">
                    Business
                  </label>

                  <input
                    type="text"
                    value={draftFilters.business}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        business: event.target.value,
                      }))
                    }
                    className={
                      inputClass + " w-full"
                    }
                    placeholder="Enter business name"
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">
                    Ticket{" "}
                    <span className="text-xs text-gray-400">
                      (e.g. IC-BU0000002)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={draftFilters.ticket}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        ticket: event.target.value,
                      }))
                    }
                    className={
                      inputClass + " w-full"
                    }
                    placeholder="Ticket code"
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">
                    Created{" "}
                    <span className="text-xs text-gray-400">
                      (DD/MM/YYYY)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={draftFilters.created}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        created: event.target.value,
                      }))
                    }
                    className={
                      inputClass + " w-full"
                    }
                    placeholder="e.g. 27/10/2025"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-turquoise text-[#0b2149] py-2 rounded-lg font-medium hover:bg-turquoise/90 transition-all disabled:opacity-60"
                  >
                    Search
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleClear}
                    className="flex-1 bg-gray-300 text-[#0b2149] py-2 rounded-lg font-medium hover:bg-gray-400 transition-all disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              </form>

              <div className="grid gap-4 md:hidden">
                {loading ? (
                  <p className="text-center">
                    Loading...
                  </p>
                ) : error ? (
                  <p className="text-center text-red-500">
                    {error}
                  </p>
                ) : resultSummary ? (
                  <p className="text-center text-gray-500">
                    {resultSummary}
                  </p>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.id}
                      className="border rounded-xl p-4 text-center shadow-sm"
                      style={{
                        background:
                          theme === "dark"
                            ? "#102b5b"
                            : "#f5f7fa",
                      }}
                    >
                      <h2 className="text-lg font-semibold text-turquoise mb-1">
                        {req.business_name || "—"}
                      </h2>

                      <p className="text-sm mb-1 capitalize">
                        Type: {req.request_type}
                      </p>

                      <p className="text-sm mb-1 font-mono">
                        Ticket: {req.ticket_code}
                      </p>

                      <p className="text-sm mb-1">
                        Created:{" "}
                        {formatDate(req.created_at)}
                      </p>

                      <p
                        className={
                          "inline-block px-3 py-1 rounded-full text-xs font-semibold mb-1 " +
                          getStatusClass(req.status)
                        }
                      >
                        {req.status}
                      </p>

                      <p className="text-sm mb-1">
                        Processed:{" "}
                        {formatDate(req.processed_at)}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRequest(req)
                        }
                        className="text-turquoise font-medium mt-1 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div
                className="hidden md:block overflow-x-auto rounded-xl shadow-md"
                style={{
                  background:
                    theme === "dark"
                      ? "#0b2149"
                      : "#ffffff",

                  color:
                    theme === "dark"
                      ? "#f0f4ff"
                      : "#0a1b2a",
                }}
              >
                <table className="min-w-full text-sm text-center">
                  <thead
                    style={{
                      background:
                        "var(--turquoise)",

                      color: "#ffffff",
                    }}
                  >
                    <tr>
                      <th className="px-4 py-3">
                        Business
                      </th>
                      <th className="px-4 py-3">
                        Type
                      </th>
                      <th className="px-4 py-3">
                        Ticket
                      </th>
                      <th className="px-4 py-3">
                        Created
                      </th>
                      <th className="px-4 py-3">
                        Status
                      </th>
                      <th className="px-4 py-3">
                        Processed
                      </th>
                      <th className="px-4 py-3">
                        Admin Note
                      </th>
                      <th className="px-4 py-3">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-red-500"
                        >
                          {error}
                        </td>
                      </tr>
                    ) : resultSummary ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          {resultSummary}
                        </td>
                      </tr>
                    ) : (
                      requests.map((req) => (
                        <tr
                          key={req.id}
                          className={
                            "border-b transition-colors " +
                            (theme === "dark"
                              ? "hover:bg-[#102b5b]"
                              : "hover:bg-gray-50")
                          }
                        >
                          <td className="px-4 py-3 font-semibold text-turquoise">
                            {req.business_name?.length >
                            25
                              ? req.business_name.slice(
                                  0,
                                  25
                                ) + "..."
                              : req.business_name ||
                                "—"}
                          </td>

                          <td className="px-4 py-3 capitalize">
                            {req.request_type}
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {req.ticket_code}
                          </td>

                          <td className="px-4 py-3">
                            {formatDate(req.created_at)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={
                                "inline-block px-3 py-1 rounded-full text-xs font-semibold " +
                                getStatusClass(req.status)
                              }
                            >
                              {req.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {formatDate(
                              req.processed_at
                            )}
                          </td>

                          <td
                            className={
                              "px-4 py-3 max-w-[180px] truncate " +
                              (theme === "dark"
                                ? "text-gray-200"
                                : "text-gray-600")
                            }
                            title={
                              req.admin_note || "—"
                            }
                          >
                            {req.admin_note || "—"}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRequest(req)
                              }
                              className="text-turquoise font-medium hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && !error && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={loading}
                />
              )}
            </div>
          </div>
        </div>

        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
              className="rounded-2xl max-w-lg w-full p-6 relative"
              style={{
                background:
                  theme === "dark"
                    ? "#0b2149"
                    : "#ffffff",

                color:
                  theme === "dark"
                    ? "#ffffff"
                    : "#0a1b2a",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(null)
                }
                className="absolute top-3 right-4 text-turquoise text-lg font-bold"
                aria-label="Close request details"
              >
                ✖
              </button>

              <h2 className="text-xl font-semibold text-center mb-4">
                📄 Request Details
              </h2>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Business:</strong>{" "}
                  {selectedRequest.business_name || "—"}
                </p>

                <p>
                  <strong>Type:</strong>{" "}
                  {selectedRequest.request_type}
                </p>

                <p>
                  <strong>Ticket:</strong>{" "}
                  {selectedRequest.ticket_code}
                </p>

                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(
                    selectedRequest.created_at
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {selectedRequest.status}
                </p>

                <p>
                  <strong>Processed:</strong>{" "}
                  {selectedRequest.processed_at
                    ? new Date(
                        selectedRequest.processed_at
                      ).toLocaleString()
                    : "—"}
                </p>

                <p>
                  <strong>Admin Note:</strong>
                </p>

                <div className="p-3 border rounded-lg max-h-48 overflow-y-auto bg-white/30 text-gray-700 dark:text-gray-200">
                  {selectedRequest.admin_note ||
                    "No note provided."}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AccountLayout>
  );
}
