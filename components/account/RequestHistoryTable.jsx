import React from "react";

export function getRequestStatusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (["approved", "resolved", "completed"].includes(value)) {
    return "bg-green-100 text-green-700";
  }

  if (["rejected", "closed"].includes(value)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export function RequestStatusBadge({
  status,
  getStatusClass = getRequestStatusClass,
}) {
  return (
    <span
      className={
        "inline-block rounded-full px-3 py-1 text-xs font-semibold " +
        getStatusClass(status)
      }
    >
      {status || "pending"}
    </span>
  );
}

/*
 * Shared presentation only:
 * - no API calls
 * - no pagination state
 * - no business/contact-specific data access
 * - no modal ownership
 *
 * columns: [{ key, label, render, className?, headerClassName? }]
 * renderMobileCard(row): consumer-defined fields inside shared card
 */
export default function RequestHistoryTable({
  rows = [],
  columns = [],
  theme = "light",
  loading = false,
  error = "",
  emptyMessage = "No matching requests found.",
  getRowKey = (row) => row.id,
  renderMobileCard,
}) {
  const dark = theme === "dark";

  const tableStyle = {
    backgroundColor: dark ? "#0b2149" : "#ffffff",
    color: dark ? "#f0f4ff" : "#0a1b2a",
  };

  const mobileCardStyle = {
    backgroundColor: dark ? "#102b5b" : "#f5f7fa",
    borderColor: dark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.10)",
  };

  const message = loading
    ? "Loading..."
    : error || (rows.length === 0 ? emptyMessage : "");

  if (!Array.isArray(rows) || !Array.isArray(columns)) {
    throw new Error("RequestHistoryTable requires array inputs.");
  }

  if (columns.length === 0) {
    throw new Error("RequestHistoryTable requires columns.");
  }

  if (typeof renderMobileCard !== "function") {
    throw new Error("RequestHistoryTable requires renderMobileCard.");
  }

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {message ? (
          <p
            role={error ? "alert" : "status"}
            className={
              "text-center " +
              (error ? "text-red-500" : "")
            }
          >
            {message}
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={getRowKey(row)}
              className="rounded-xl border p-4 text-center shadow-sm"
              style={mobileCardStyle}
            >
              {renderMobileCard(row)}
            </article>
          ))
        )}
      </div>

      <div
        className="hidden md:block overflow-x-auto rounded-xl shadow-md"
        style={tableStyle}
      >
        <table className="min-w-full text-sm text-center">
          <thead
            style={{
              backgroundColor: "var(--turquoise)",
              color: "#ffffff",
            }}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={
                    column.headerClassName || "px-4 py-3"
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {message ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={
                    "px-4 py-8 text-center " +
                    (error ? "text-red-500" : "")
                  }
                  role={error ? "alert" : "status"}
                >
                  {message}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={
                    "border-b transition-colors " +
                    (dark
                      ? "hover:bg-[#102b5b]"
                      : "hover:bg-gray-50")
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={
                        column.className || "px-4 py-3"
                      }
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
