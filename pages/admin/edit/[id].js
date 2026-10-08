//frontend/pages/admin/edit/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import apiClient from "../../../utils/apiClient";
import AdminLayout from "../../../components/admin/AdminLayout";
import BusinessWizard from "../../../components/admin/BusinessWizard";

function buildAdminEditFormData(data) {
  const form = new FormData();

  const cleanedData = {
    ...data,

    availability_hours:
      data.availability_type === "business_hours"
        ? data.availability_hours
        : null,
  };

  Object.entries(cleanedData).forEach(([key, value]) => {
    // Current media is already stored in DB.
    // Only removed_media and new uploads are needed by Update V2.
    if (
      key === "logo_url" ||
      key === "cover_image_url" ||
      key === "gallery" ||
      key === "id" ||
      key === "provenance" ||
      key === "update_scope" ||
      key === "is_deleted" ||
      key === "deleted_at" ||
      key === "deleted_by_user_id" ||
      key === "deleted_reason" ||
      key === "deleted_source"
    ) {
      return;
    }

    // New gallery uploads
    if (key === "gallery_files") {
      if (Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            form.append("gallery_files", file);
          }
        });
      }

      return;
    }

    // New logo / cover uploads
    if (key === "logo_file" || key === "cover_file") {
      if (value instanceof File) {
        form.append(key, value);
      }

      return;
    }

    // Arrays such as services, tags, subcategory_ids
    if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
      return;
    }

    // Objects such as availability_hours and removed_media
    if (typeof value === "object" && value !== null) {
      form.append(key, JSON.stringify(value));
      return;
    }

    if (value !== null && value !== undefined) {
      form.append(key, String(value));
    }
  });

  return form;
}

function formatCreationOrigin(value) {
  switch (value) {
    case "user_request":
      return "User Request";
    case "platform_curated":
      return "Platform Curated";
    case "historical_unknown":
      return "Historical / Unknown";
    default:
      return value || "—";
  }
}

export default function EditBusinessPage() {
  const router = useRouter();

  const {
    id,
    requestId: rawRequestId,
  } = router.query;

  const hasRequestContext =
    rawRequestId !== undefined;

  const requestId =
    hasRequestContext
      ? Number(rawRequestId)
      : null;

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const businessId = Number(id);

    if (!Number.isInteger(businessId) || businessId < 1) {
      setError("Invalid business ID.");
      setLoading(false);
      return;
    }

    if (
      hasRequestContext &&
      (
        !Number.isInteger(requestId) ||
        requestId < 1
      )
    ) {
      setError("Invalid business request context.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadBusinessPrefill() {
      setLoading(true);
      setError("");

      try {
        const res = await apiClient.get(
          `/admin/businesses/${businessId}/prefill-v2`,
          {
            withCredentials: true,
          }
        );

        if (!mounted) return;

        if (!hasRequestContext) {
          /*
           * PLR-SUP-REQ-01
           * Direct Admin Edit is admin-note authorized only.
           *
           * Ticket-based UPDATE authority exists exclusively
           * through the request-bound route.
           */
          setInitialData({
            ...res.data,
            change_source_type:
              "admin_note",
            ticket_code:
              "",
            admin_note:
              "",
          });

          return;
        }

        /*
         * PLR-SUP-REQ-01
         * Request-bound UPDATE context is loaded separately
         * from the business prefill and remains immutable.
         */
        const requestRes = await apiClient.get(
          `/admin/requests/${requestId}`,
          {
            withCredentials: true,
            headers: {
              "x-iranconnect-admin": "1",
            },
          }
        );

        const request =
          requestRes.data;

        const requestStatus =
          String(
            request?.status || ""
          ).trim();

        const requestBusinessId =
          Number(
            request?.business_id
          );

        if (
          request?.request_type !== "update" ||
          !(
            requestStatus === "pending" ||
            requestStatus === "pending_review"
          ) ||
          !Number.isInteger(requestBusinessId) ||
          requestBusinessId !== businessId
        ) {
          throw new Error(
            "This business request is not eligible for request-bound update fulfillment."
          );
        }

        if (
          request?.update_fulfilled === true
        ) {
          throw new Error(
            "This update request has already been fulfilled and is ready for approval."
          );
        }

        /*
         * PLR-SUP-REQ-01 / F04
         *
         * Backend update_scope is the sole authority for which
         * request payload fields may replace current Business values.
         *
         * Do NOT derive semantic differences in the Frontend.
         */
        const updateScope =
          request?.update_scope &&
          typeof request.update_scope === "object"
            ? request.update_scope
            : {
                allowed_update_fields: [],
                allowed_media_operations: {
                  logo: false,
                  cover: false,
                  gallery: false,
                },
              };

        const requestPayload =
          request?.payload &&
          typeof request.payload === "object" &&
          !Array.isArray(request.payload)
            ? request.payload
            : {};

        const allowedUpdateFields =
          Array.isArray(
            updateScope.allowed_update_fields
          )
            ? updateScope.allowed_update_fields
            : [];

        const requestedFieldValues = {};

        for (const field of allowedUpdateFields) {
          if (
            Object.prototype.hasOwnProperty.call(
              requestPayload,
              field
            )
          ) {
            requestedFieldValues[field] =
              requestPayload[field];
          }
        }

        setInitialData({
          ...res.data,
          ...requestedFieldValues,

          /*
           * Authoritative Backend-provided request scope.
           * Used only for request-bound Admin UX enforcement.
           */
          update_scope:
            updateScope,

          /*
           * Display-only request context.
           * Request authority comes from requestId in the route.
           */
          change_source_type:
            "ticket",

          business_request_id:
            requestId,

          ticket_code:
            request.ticket_code || "",

          /*
           * Display-only authorization evidence from the
           * originating user UPDATE request.
           *
           * This is not Business ownership authority and must
           * never be submitted back as mutable Business data.
           */
          request_authorization_confirmed:
            requestPayload.owner_confirmed === true ||
            requestPayload.owner_confirmed === "true",

          admin_note:
            "",
        });
      } catch (err) {
        console.error("❌ Failed to load admin edit prefill:", err);

        if (!mounted) return;

        setError(
          err.response?.data?.error ||
            "Unable to load business edit data."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBusinessPrefill();

    return () => {
      mounted = false;
    };
  }, [
    router.isReady,
    id,
    rawRequestId,
    hasRequestContext,
    requestId,
  ]);

  async function submitAdminEdit(data) {
    const businessId = Number(id);

    const form = buildAdminEditFormData(data);

    if (hasRequestContext) {
      /*
       * PLR-SUP-REQ-01
       * Request-bound UPDATE authority is the route requestId.
       * Client-controlled ticket/request/provenance context must
       * never be sent to the Backend.
       */
      form.delete("ticket_code");
      form.delete("business_request_id");
      form.delete("change_source_type");
      form.delete("admin_note");

      // Frontend-only request confirmation evidence.
      form.delete("request_authorization_confirmed");

      form.delete("created_by_user_id");
      form.delete("requested_by_user_id");
      form.delete("creation_origin");

      form.delete("requester_user_id");
      form.delete("requester_display_email");

      return apiClient.put(
        `/admin/businesses/requests/${requestId}/update-v2`,
        form,
        {
          withCredentials: true,
          timeout: 120000,
        }
      );
    }

    return apiClient.put(
      `/admin/businesses/${businessId}/update-v2`,
      form,
      {
        withCredentials: true,
        timeout: 120000,
      }
    );
  }

  function handleSubmissionSuccess() {
    window.setTimeout(() => {
      router.push(
        hasRequestContext
          ? "/admin/requests"
          : "/admin/businesses"
      );
    }, 1500);
  }

  return (
    <AdminLayout>
      <main className="admin-container">
        <div className="mb-5">
          <h2 className="admin-title">Edit Business</h2>

          <p className="admin-hint mt-2">
            Update the business profile, services, location, contact
            information, visibility, and media.
          </p>
        </div>

        {loading ? (
          <section className="admin-section">
            <p className="admin-muted">Loading business data...</p>
          </section>
        ) : error ? (
          <section className="admin-section">
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              {error}
            </p>

            <button
              type="button"
              className="admin-btn admin-btn-secondary mt-4"
              onClick={() => router.push("/admin/businesses")}
            >
              Back to Businesses
            </button>
          </section>
        ) : (
          <>
            <section className="admin-card mb-5">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Business Provenance
                </h3>

                <p className="admin-hint mt-1">
                  Read-only creation and requester metadata.
                  These values are controlled by the server and
                  cannot be edited here.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="font-medium">
                    Creation Origin
                  </div>
                  <div className="mt-1 opacity-75">
                    {formatCreationOrigin(
                      initialData?.provenance
                        ?.creation_origin
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-medium">
                    Created By
                  </div>
                  <div className="mt-1 opacity-75">
                    {initialData?.provenance
                      ?.created_by?.email || "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    User ID:{" "}
                    {initialData?.provenance
                      ?.created_by?.user_id ?? "—"}
                    {" · "}
                    Role:{" "}
                    {initialData?.provenance
                      ?.created_by?.role || "—"}
                  </div>
                </div>

                <div>
                  <div className="font-medium">
                    Requested By
                  </div>
                  <div className="mt-1 opacity-75">
                    {initialData?.provenance
                      ?.requested_by?.email || "—"}
                  </div>
                  <div className="text-xs opacity-60">
                    User ID:{" "}
                    {initialData?.provenance
                      ?.requested_by?.user_id ?? "—"}
                    {" · "}
                    Role:{" "}
                    {initialData?.provenance
                      ?.requested_by?.role || "—"}
                  </div>
                </div>

                <div>
                  <div className="font-medium">
                    Originating Request
                  </div>

                  {initialData?.provenance
                    ?.originating_request ? (
                    <>
                      <div className="mt-1 opacity-75">
                        Ticket:{" "}
                        {initialData.provenance
                          .originating_request
                          .ticket_code || "—"}
                      </div>

                      <div className="text-xs opacity-60">
                        Request ID:{" "}
                        {initialData.provenance
                          .originating_request
                          .request_id ?? "—"}
                        {" · "}
                        Type:{" "}
                        {initialData.provenance
                          .originating_request
                          .request_type || "—"}
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 opacity-75">
                      —
                    </div>
                  )}
                </div>
              </div>
            </section>

            <BusinessWizard
              mode={
              hasRequestContext
                ? "admin-edit-request"
                : "admin-edit"
            }
            initialData={initialData}
            onSubmit={submitAdminEdit}
            onSubmissionSuccess={handleSubmissionSuccess}
          />
          </>
        )}
      </main>
    </AdminLayout>
  );
}
