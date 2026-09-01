// pages/admin/add-v2.js

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import apiClient from "../../utils/apiClient";

function isPendingStatus(status) {
  return (
    status === "pending" ||
    status === "pending_review"
  );
}

function buildTicketMediaContext(attachments) {
  const items = Array.isArray(attachments)
    ? attachments
    : [];

  const normalizeAttachment = (item) => {
    const role = String(
      item?.type || item?.role || ""
    )
      .trim()
      .toLowerCase();

    const url = String(
      item?.path ||
      item?.secure_url ||
      item?.url ||
      ""
    ).trim();

    if (!role || !url) {
      return null;
    }

    return {
      role,
      url,
      filename:
        item?.filename ||
        item?.original_filename ||
        "",
    };
  };

  const media = items
    .map(normalizeAttachment)
    .filter(Boolean);

  const logo =
    media.find(
      (item) => item.role === "logo"
    ) || null;

  const cover =
    media.find(
      (item) => item.role === "cover"
    ) || null;

  const gallery = media
    .filter(
      (item) => item.role === "gallery"
    )
    .map((item) => ({
      url: item.url,
      filename: item.filename,
    }));

  return {
    /*
     * Display-only ticket media context.
     *
     * Backend does NOT trust these URLs when creating the
     * business. Request-bound creation resolves immutable
     * business_request_assets using business_request_id.
     */
    logo_url: logo?.url || null,
    cover_image_url: cover?.url || null,
    gallery,
  };
}

function buildTicketInitialData(request) {
  const payload =
    request?.payload &&
    typeof request.payload === "object"
      ? request.payload
      : {};

  const ticketMedia =
    buildTicketMediaContext(
      request?.attachments
    );

  return {
    ...payload,
    ...ticketMedia,

    change_source_type: "ticket",
    business_request_id: request.id,

    /*
     * ticket_code is display-only context.
     * Backend does not trust or consume this value for correlation.
     */
    ticket_code: request.ticket_code || "",

    admin_note: "",
  };
}

export default function AddBusinessV2() {
  const router = useRouter();

  const [requestDetails, setRequestDetails] =
    useState(null);

  const [loadingRequest, setLoadingRequest] =
    useState(false);

  const [requestError, setRequestError] =
    useState("");

  const rawRequestId = router.query.requestId;

  const requestId = useMemo(() => {
    if (!router.isReady || rawRequestId === undefined) {
      return null;
    }

    const raw = Array.isArray(rawRequestId)
      ? rawRequestId[0]
      : rawRequestId;

    if (!/^[1-9]\d*$/.test(String(raw || ""))) {
      return NaN;
    }

    return Number(raw);
  }, [router.isReady, rawRequestId]);

  const isTicketCreate =
    Number.isInteger(requestId) &&
    requestId > 0;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (rawRequestId === undefined) {
      setRequestDetails(null);
      setRequestError("");
      return;
    }

    if (!isTicketCreate) {
      setRequestDetails(null);
      setRequestError(
        "Invalid business request context."
      );
      return;
    }

    let cancelled = false;

    async function loadRequest() {
      setLoadingRequest(true);
      setRequestError("");

      try {
        const res = await apiClient.get(
          `/admin/requests/${requestId}`,
          {
            withCredentials: true,
            headers: {
              "x-iranconnect-admin": "1",
            },
          }
        );

        const request = res.data;

        if (
          request?.request_type !== "new" ||
          !isPendingStatus(request?.status) ||
          request?.business_id
        ) {
          throw new Error(
            "This request is not eligible for new-business creation."
          );
        }

        if (!cancelled) {
          setRequestDetails(request);
        }
      } catch (err) {
        if (!cancelled) {
          setRequestDetails(null);
          setRequestError(
            err?.response?.data?.error ||
            err?.message ||
            "Unable to load business request."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRequest(false);
        }
      }
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    rawRequestId,
    requestId,
    isTicketCreate,
  ]);

  if (!router.isReady) {
    return (
      <AdminLayout>
        <main className="admin-container">
          <p className="admin-muted">
            Loading…
          </p>
        </main>
      </AdminLayout>
    );
  }

  if (
    rawRequestId !== undefined &&
    (
      loadingRequest ||
      (!requestDetails && !requestError)
    )
  ) {
    return (
      <AdminLayout>
        <main className="admin-container">
          <p className="admin-muted">
            Loading business request…
          </p>
        </main>
      </AdminLayout>
    );
  }

  if (
    rawRequestId !== undefined &&
    requestError
  ) {
    return (
      <AdminLayout>
        <main className="admin-container">
          <div className="admin-card">
            <h2 className="admin-title">
              Unable to start ticket-based creation
            </h2>

            <p className="text-red-500 mt-3">
              {requestError}
            </p>

            <button
              type="button"
              className="admin-btn admin-btn-secondary mt-5"
              onClick={() =>
                router.push("/admin/requests")
              }
            >
              Back to Business Requests
            </button>
          </div>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="admin-container">
        {isTicketCreate && requestDetails ? (
          <>
            <div className="admin-card mb-6">
              <h2 className="admin-title">
                Create Business from Request
              </h2>

              <div className="mt-3 text-sm space-y-1">
                <div>
                  <strong>Ticket:</strong>{" "}
                  <span className="font-mono">
                    {requestDetails.ticket_code}
                  </span>
                </div>

                <div>
                  <strong>Request ID:</strong>{" "}
                  {requestDetails.id}
                </div>

                <div>
                  <strong>Status:</strong>{" "}
                  {requestDetails.status}
                </div>
              </div>

              <p className="admin-hint mt-3">
                This request context is fixed. You may review
                and edit the business details before creation,
                but the business will remain linked to this
                request.
              </p>
            </div>

            <BusinessWizard
              mode="admin-create-ticket"
              initialData={buildTicketInitialData(
                requestDetails
              )}
            />
          </>
        ) : (
          <BusinessWizard
            mode="admin-create"
            initialData={{
              change_source_type: "admin_note",
            }}
          />
        )}
      </main>
    </AdminLayout>
  );
}
