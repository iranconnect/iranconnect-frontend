//frontend/pages/account/businesses.js
import { useEffect, useState } from "react";
import Link from "next/link";

import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

export default function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";

    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.getAttribute("data-theme") || "light"
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true);
        setError("");

        const response = await apiClient.get(
          "/owner/me/businesses",
          {
            withCredentials: true,
          }
        );

        setBusinesses(response.data?.rows || []);
      } catch (err) {
        console.error("Unable to load managed businesses:", err);

        setError(
          err.response?.data?.error ||
            "Unable to load your business listings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  function formatCompletion(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "—";
    }

    return `${numericValue.toFixed(2)}%`;
  }

  function formatLocation(business) {
    return [business.city, business.country]
      .filter(Boolean)
      .join(", ") || "—";
  }

  const cardStyle = {
    background: theme === "dark" ? "#0b2149" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#0a1b2a",
    borderColor:
      theme === "dark"
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)",
    boxShadow:
      theme === "dark"
        ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
        : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
  };

  return (
    <AccountLayout>
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 text-center">
            <h1
              className="text-2xl font-bold"
              style={{ color: theme === "dark" ? "#0A1D37" : "#0A1D37" }}
            >
              🏢 Business Management
            </h1>

            <p className="mt-2 text-sm opacity-75">
              Manage the business listings for which your ownership has been verified.
            </p>

            <Link
              href="/account/requests"
              className="mt-3 inline-block text-sm font-medium text-turquoise hover:underline"
            >
              View request history
            </Link>
          </div>

          <div
            className="rounded-2xl border p-6 transition-all duration-300"
            style={cardStyle}
          >
            {loading && (
              <p className="py-10 text-center text-sm opacity-70">
                Loading business listings...
              </p>
            )}

            {!loading && error && (
              <p className="py-10 text-center text-sm text-red-500">
                {error}
              </p>
            )}

            {!loading && !error && businesses.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm opacity-75">
                  You do not have any verified business listings to manage.
                </p>
              </div>
            )}

            {!loading && !error && businesses.length > 0 && (
              <>
                <div className="grid gap-4 md:hidden">
                  {businesses.map((business) => {
                    const isDeleted = business.is_deleted === true;

                    return (
                      <article
                        key={business.id}
                        className="rounded-xl border p-4"
                        style={{
                          background:
                            theme === "dark"
                              ? "#102b5b"
                              : "#f8fafc",
                          borderColor:
                            theme === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.08)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-semibold text-turquoise">
                              {business.name}
                            </h2>

                            <p className="mt-1 text-xs opacity-75">
                              {business.category || "—"}
                              {business.sub_category
                                ? ` · ${business.sub_category}`
                                : ""}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isDeleted
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isDeleted ? "Deleted" : "Active"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <p>
                            <strong>Location:</strong>{" "}
                            {formatLocation(business)}
                          </p>

                          <p>
                            <strong>Profile completion:</strong>{" "}
                            {formatCompletion(
                              business.completion_percentage
                            )}
                          </p>

                          <p>
                            <strong>Visibility:</strong>{" "}
                            {isDeleted
                              ? "Not publicly available"
                              : business.is_public
                              ? "Public"
                              : "Private"}
                          </p>

                          {isDeleted && (
                            <p className="text-xs text-red-500">
                              This listing is no longer publicly available.
                            </p>
                          )}
                        </div>

                        {!isDeleted && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/account/update-business?businessId=${business.id}`}
                              className="rounded-lg border border-turquoise px-3 py-2 text-sm font-medium text-turquoise hover:bg-turquoise hover:text-navy transition"
                            >
                              Update business
                            </Link>

                            <Link
                              href={`/account/delete-business?businessId=${business.id}`}
                              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                            >
                              Request deletion
                            </Link>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead
                      className="border-b"
                      style={{
                        borderColor:
                          theme === "dark"
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.08)",
                      }}
                    >
                      <tr>
                        <th className="px-4 py-3">Business</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Profile completion</th>
                        <th className="px-4 py-3">Visibility</th>
                        <th className="px-4 py-3">Lifecycle</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {businesses.map((business) => {
                        const isDeleted = business.is_deleted === true;

                        return (
                          <tr
                            key={business.id}
                            className="border-b align-top"
                            style={{
                              borderColor:
                                theme === "dark"
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(0,0,0,0.06)",
                            }}
                          >
                            <td className="px-4 py-4">
                              <p className="font-semibold text-turquoise">
                                {business.name}
                              </p>

                              {business.slug && (
                                <p className="mt-1 text-xs opacity-60">
                                  /business/{business.slug}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <p>{business.category || "—"}</p>

                              {business.sub_category && (
                                <p className="mt-1 text-xs opacity-70">
                                  {business.sub_category}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              {formatLocation(business)}
                            </td>

                            <td className="px-4 py-4 font-medium">
                              {formatCompletion(
                                business.completion_percentage
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  business.is_public && !isDeleted
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {isDeleted
                                  ? "Not available"
                                  : business.is_public
                                  ? "Public"
                                  : "Private"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isDeleted
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isDeleted ? "Deleted" : "Active"}
                              </span>

                              {isDeleted && (
                                <p className="mt-2 max-w-[180px] text-xs text-red-500">
                                  This listing is no longer publicly available.
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              {!isDeleted && (
                                <div className="flex justify-end gap-2">
                                  <Link
                                    href={`/account/update-business?businessId=${business.id}`}
                                    className="rounded-lg border border-turquoise px-3 py-2 text-xs font-medium text-turquoise hover:bg-turquoise hover:text-navy transition"
                                  >
                                    Update
                                  </Link>

                                  <Link
                                    href={`/account/delete-business?businessId=${business.id}`}
                                    className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                                  >
                                    Delete
                                  </Link>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </AccountLayout>
  );
}
