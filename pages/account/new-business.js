//frontend/pages/account/new-business.js
'use client';

import { useRouter } from "next/router";

import AccountLayout from "../../components/account/AccountLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import apiClient from "../../utils/apiClient";

function buildNewBusinessRequestFormData(wizardData) {
  const form = new FormData();

  const cleanedData = {
    ...wizardData,

    availability_hours:
      wizardData.availability_type === "business_hours"
        ? wizardData.availability_hours
        : null,
  };

  Object.entries(cleanedData).forEach(([key, value]) => {
    // Files uploaded through the Wizard
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

    if (key === "logo_file" || key === "cover_file") {
      if (value instanceof File) {
        form.append(key, value);
      }

      return;
    }

    // These are UI-only / admin-only fields and must not enter ticket payload.
    if (
      key === "logo_url" ||
      key === "cover_image_url" ||
      key === "gallery" ||
      key === "removed_media" ||
      key === "force_create" ||
      key === "change_source_type" ||
      key === "ticket_code" ||
      key === "admin_note"
    ) {
      return;
    }

    if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
      return;
    }

    if (typeof value === "object" && value !== null) {
      form.append(key, JSON.stringify(value));
      return;
    }

    if (value !== null && value !== undefined) {
      form.append(key, String(value));
    }
  });

  form.append("request_type", "new");

  return form;
}

export default function NewBusinessRequestPage() {
  const router = useRouter();

  async function submitNewBusinessRequest(wizardData) {
    const form = buildNewBusinessRequestFormData(
      wizardData
    );

    return apiClient.post("/requests", form, {
      withCredentials: true,
      timeout: 300000,
    });
  }

  function handleSubmissionSuccess({ ticketCode }) {
    window.setTimeout(() => {
      router.push(
        ticketCode
          ? `/account/requests?ticket=${encodeURIComponent(ticketCode)}`
          : "/account/requests"
      );
    }, 500);
  }

  return (
    <AccountLayout>
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 text-center">
            <h1
              className="text-2xl font-semibold"
              style={{ color: "#0A1D37" }}
            >
              Add New Business Request
            </h1>

            <p className="mt-2 text-sm text-muted">
              Submit your business details for review. Approved listings
              will be published on IranConnect.
            </p>
          </div>

          <BusinessWizard
            mode="user-new"
            onSubmit={submitNewBusinessRequest}
            onSubmissionSuccess={handleSubmissionSuccess}
          />
        </div>
      </main>
    </AccountLayout>
  );
}
