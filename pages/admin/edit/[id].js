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
      key === "id"
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

export default function EditBusinessPage() {
  const router = useRouter();
  const { id } = router.query;

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

        setInitialData(res.data);
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
  }, [router.isReady, id]);

  async function submitAdminEdit(data) {
    const businessId = Number(id);

    const form = buildAdminEditFormData(data);

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
      router.push("/admin/businesses");
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
          <BusinessWizard
            mode="admin-edit"
            initialData={initialData}
            onSubmit={submitAdminEdit}
            onSubmissionSuccess={handleSubmissionSuccess}
          />
        )}
      </main>
    </AdminLayout>
  );
}
