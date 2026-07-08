// components/admin/BusinessWizard/StepPreviewSubmit.jsx

import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";

const BUSINESS_TYPE_LABELS = {
  freelancer: "Freelancer / Self-employed",
  company: "Registered Company",
  clinic: "Clinic / Office",
  shop: "Physical Shop",
  online: "Online Business",
};

const SERVICE_MODE_LABELS = {
  on_site: "On-site (customers visit)",
  at_home: "At customer location",
  remote: "Remote / Online",
  hybrid: "Hybrid",
};

const AVAILABILITY_LABELS = {
  always_open: "Always open",
  business_hours: "Business hours",
  appointment_only: "Appointment only",
};

function formatBusinessHours(hours) {
  if (!hours || typeof hours !== "object") {
    return null;
  }

  const WEEK_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return WEEK_DAYS.map((day) => {
    const value = hours[day];

    if (!value) return null;

    const label =
      day.charAt(0).toUpperCase() + day.slice(1);

    if (value.closed) {
      return `${label}: Closed`;
    }

    return `${label}: ${value.open} - ${value.close}`;
  })
    .filter(Boolean)
    .join("\n");
}

function isRemoved(type, url, removedMedia) {

  if (!removedMedia?.[type]) {
    return false;
  }

  return removedMedia[type].some(
    (item) => item.url === url
  );

}

export default function StepPreviewSubmit({
  data,
  setData,
  onBack,
  onSubmit,
  loading,
  mode,
  submitMessage,
  submitError,
  ticketCode,
  submitSuccess,
}) {

  const [categoryName, setCategoryName] = useState("");

  const [subcategoryNames, setSubcategoryNames] = useState([]);
  
  const [serviceNames, setServiceNames] = useState([]);
  
  const [tagNames, setTagNames] = useState([]);

  const isAdminCreate = mode === "admin-create";
  const isAdminEdit = mode === "admin-edit";
  const isUserUpdate = mode === "user-update";
  const isUserNew = mode === "user-new";

  const isUserCatalogMode =
    isUserUpdate || isUserNew;

  const normalizedChangeSource =
    String(data.change_source_type || "").trim();

  const normalizedTicketCode =
    String(data.ticket_code || "").trim();

  const normalizedAdminNote =
    String(data.admin_note || "").trim();

  const isValidAdminEditAuthorization =
    !isAdminEdit ||
    (
      normalizedChangeSource === "ticket" &&
      normalizedTicketCode.length > 0
    ) ||
    (
      normalizedChangeSource === "admin_note" &&
      normalizedAdminNote.length > 0
    );

  const isSubmitDisabled =
    loading ||
    submitSuccess ||
    !isValidAdminEditAuthorization;

  function setChangeSourceType(nextSourceType) {
    setData((prev) => ({
      ...prev,
      change_source_type: nextSourceType,
      ticket_code:
        nextSourceType === "ticket"
          ? prev.ticket_code || ""
          : "",
      admin_note:
        nextSourceType === "admin_note"
          ? prev.admin_note || ""
          : "",
    }));
  }

  function handleFinalSubmit() {
    if (!isValidAdminEditAuthorization) {
      return;
    }

    onSubmit();
  }

  const previewCopy = isAdminEdit
    ? {
        title: "Review & Update Business",
        subtitle:
          "Step 5 of 5 — Review changes before updating this business",
        mediaTitle: "Media & Visibility",
        loadingTitle: "Updating business profile…",
        loadingText:
          "Business details, services, media, and profile settings are being updated. Please do not refresh, close, or submit the form again.",
        submitLabel: "Submit & Update Business",
        loadingLabel: "Updating business…",
      }
    : isUserUpdate
      ? {
          title: "Review & Submit Update Request",
          subtitle:
            "Step 5 of 5 — Review your requested changes before submission",
          mediaTitle: "Media, Visibility & Confirmation",
          loadingTitle:
            "Creating your secure request archive…",
          loadingText:
            "Your business details and media are being securely archived. This can take a few minutes when several images are included. Please do not refresh, close, or submit the form again.",
          submitLabel: "Submit Update Request",
          loadingLabel: "Submitting update request…",
        }
      : isUserNew
        ? {
            title: "Review & Submit New Business Request",
            subtitle:
              "Step 5 of 5 — Review your business details before sending your request",
            mediaTitle: "Media, Visibility & Confirmation",
            loadingTitle:
              "Creating your secure new-business request…",
            loadingText:
              "Your business details and media are being securely prepared for review. Please do not refresh, close, or submit the form again.",
            submitLabel: "Submit New Business Request",
            loadingLabel:
              "Submitting new business request…",
          }
        : {
            title: "Review & Create Business",
            subtitle:
              "Step 5 of 5 — Review all business details before creation",
            mediaTitle: "Media, Visibility & Confirmation",
            loadingTitle: "Creating business…",
            loadingText:
              "Business details, services, media, and profile settings are being created. Please do not refresh, close, or submit the form again.",
            submitLabel: "Submit & Create Business",
            loadingLabel: "Creating business…",
          };

  
  useEffect(() => {
  
    async function loadPreviewLabels() {
  
      try {
  
        /* CATEGORY */
        if (data.category_id) {
  
          const categoryRes = await apiClient.get(
            isUserCatalogMode
              ? "/businesses/onboarding/categories"
              : "/admin/categories/all"
          );
  
          const categories =
            categoryRes.data?.data || [];
  
          const foundCategory =
            categories.find(
              (c) =>
                Number(c.id) ===
                Number(data.category_id)
            );
  
          setCategoryName(
            foundCategory?.name || ""
          );
        }
  
        /* SUBCATEGORIES */
        if (
          data.category_id &&
          Array.isArray(data.subcategory_ids)
        ) {
  
          const subRes =
            await apiClient.get(
              isUserCatalogMode
                ? "/businesses/onboarding/subcategories"
                : "/admin/subcategories",
              {
                params: {
                  category_id:
                    data.category_id,
                },
              }
            );
  
          const allSubs =
            subRes.data?.data || [];
  
          const matchedSubs =
            allSubs
              .filter((s) =>
                data.subcategory_ids.includes(s.id)
              )
              .map((s) => s.name);
  
          setSubcategoryNames(matchedSubs);
        }
  
        /* SERVICES */
        if (
          Array.isArray(data.services) &&
          data.services.length > 0
        ) {
  
          const serviceRes =
            await apiClient.get(
              isUserCatalogMode
                ? "/businesses/services"
                : "/admin/services",
              {
                params: {
                  subcategory_ids:
                    data.subcategory_ids || [],
                },
              }
            );
  
          const allServices =
            serviceRes.data?.data || [];
  
          const matchedServices =
            allServices
              .filter((s) =>
                data.services.includes(s.id)
              )
              .map((s) => s.name);
  
          setServiceNames(matchedServices);
        }
  
        /* TAGS */
        if (
          Array.isArray(data.tags)
        ) {
  
          const tagRes =
            await apiClient.get(
              "/businesses/tags",
              {
                params: {
                  category_id: data.category_id,
                  service_ids: (data.services || []).join(","),
                },
              }
            );
  
          const allTags =
            tagRes.data?.data || [];
  
          const matchedTags =
            allTags
              .filter((t) =>
                data.tags.includes(t.id)
              )
              .map((t) => t.name);
  
          setTagNames(matchedTags);
        }
  
      } catch (err) {
  
        console.error(
          "Preview label loading failed",
          err
        );
  
      }
  
    }
  
    loadPreviewLabels();
  
  }, [
    mode,
    data.category_id,
    data.subcategory_ids,
    data.services,
    data.tags,
  ]);
  
  return (
    <div className="admin-section">
      <h2 className="admin-title mb-1">
        {previewCopy.title}
      </h2>
      
      <p className="admin-muted mb-6">
        {previewCopy.subtitle}
      </p>

      {/* ─────────────────────────
         BASIC BUSINESS INFORMATION
      ───────────────────────── */}
      <Section title="Basic Business Information">
      
        <Item
          label="Business name"
          value={data.name}
        />
      
        <Item
          label="Business category"
          value={categoryName}
        />
      
        <Item
          label="Subcategories"
          value={
            subcategoryNames.length > 0
              ? subcategoryNames.join(", ")
              : null
          }
          multiline
        />
      
        <Item
          label="Legal name"
          value={data.legal_name}
        />
      
        <Item
          label="Business type"
          value={
            BUSINESS_TYPE_LABELS[data.business_type] ||
            data.business_type
          }
        />
      
        <Item
          label="Year established"
          value={data.year_established}
        />
      
        <Item
          label="Short description"
          value={data.short_description}
          multiline
        />
      
        <Item
          label="Full description"
          value={data.full_description}
          multiline
        />
      
      </Section>


      {/* ─────────────────────────
         SERVICES & TAGS
      ───────────────────────── */}
      <Section title="Services & Tags">
      
        <Item
          label="Services offered"
          value={
            serviceNames.length > 0
              ? serviceNames.join(", ")
              : null
          }
          multiline
        />
      
        <Item
          label="Tags"
          value={
            tagNames.length > 0
              ? tagNames.join(", ")
              : null
          }
          multiline
        />
      
      </Section>
      {/* ─────────────────────────
         LOCATION, AVAILABILITY & CONTACT
      ───────────────────────── */}
      <Section title="Location, Availability & Contact">
      
        {/* Service mode */}
        <Item
          label="Service mode"
          value={
            SERVICE_MODE_LABELS[data.service_mode] ||
            data.service_mode
          }
        />
      
        {/* Availability type */}
        <Item
          label="Availability type"
          value={
            AVAILABILITY_LABELS[data.availability_type] ||
            data.availability_type
          }
        />
      
        {/* Availability note */}
        <Item
          label="Availability note"
          value={data.availability_note}
          multiline
        />
      
        {/* Business hours */}
        <Item
          label="Business hours"
          value={formatBusinessHours(data.availability_hours)}
          multiline
        />
      
        {/* Business location */}
        <Item
          label="Business location (Google Maps link)"
          value={data.location_map_url}
        />
      
        {/* Base location */}
        <Item
          label="Service base location (Google Maps link)"
          value={data.base_location_map_url}
        />
      
        {/* Address */}
        <Item
          label="Address"
          value={data.address}
          multiline
        />
      
        {/* Country */}
        <Item
          label="Country"
          value={data.country}
        />
      
        {/* City */}
        <Item
          label="City"
          value={data.city}
        />
      
        {/* Postal code */}
        <Item
          label="Postal code"
          value={data.postal_code}
        />
      
        {/* Service radius */}
        <Item
          label="Service radius (km)"
          value={data.service_radius_km}
        />
      
        {/* Phone */}
        <Item
          label="Phone"
          value={data.phone}
        />
      
        {/* Email */}
        <Item
          label="Email"
          value={data.email}
        />
      
        {/* Website */}
        <Item
          label="Website"
          value={data.website}
        />
      
        {/* Show phone */}
        <Item
          label="Show phone number"
          value={
            data.show_phone === true
              ? "Yes"
              : data.show_phone === false
                ? "No"
                : null
          }
        />
      
        {/* Show email */}
        <Item
          label="Show email"
          value={
            data.show_email === true
              ? "Yes"
              : data.show_email === false
                ? "No"
                : null
          }
        />
      
        {/* Instagram */}
        <Item
          label="Instagram"
          value={data.instagram_url}
        />
      
        {/* Facebook */}
        <Item
          label="Facebook"
          value={data.facebook_url}
        />
      
        {/* LinkedIn */}
        <Item
          label="LinkedIn"
          value={data.linkedin_url}
        />
      
        {/* Twitter / X */}
        <Item
          label="Twitter / X"
          value={data.twitter_url}
        />
      
        {/* Telegram */}
        <Item
          label="Telegram"
          value={data.telegram_url}
        />
      
        {/* WhatsApp */}
        <Item
          label="WhatsApp"
          value={data.whatsapp_number}
        />
      
      </Section>
      {/* ─────────────────────────
         MEDIA, VISIBILITY & COMPLIANCE
      ───────────────────────── */}
      <Section title={previewCopy.mediaTitle}>
      
        {/* LOGO */}
        {(data.logo_url || data.logo_file) && (
          <div style={{ marginBottom: 24 }}>
      
            <strong>Business logo:</strong>
      
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
      
              {/* Current logo */}
              {data.logo_url && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
              
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      minHeight: 18,
                      color: isRemoved(
                        "logo",
                        data.logo_url,
                        data.removed_media
                      )
                        ? "#ef4444"
                        : "#64748b",
                      fontWeight: isRemoved(
                        "logo",
                        data.logo_url,
                        data.removed_media
                      )
                        ? 600
                        : 500,
                    }}
                  >
                    {isRemoved(
                      "logo",
                      data.logo_url,
                      data.removed_media
                    )
                      ? "Marked for removal"
                      : "Current image"}
                  </div>
              
                  <img
                    src={data.logo_url}
                    alt="Current logo"
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: isRemoved(
                        "logo",
                        data.logo_url,
                        data.removed_media
                      )
                        ? "3px solid #ef4444"
                        : "1px solid #cbd5e1",
                      opacity: isRemoved(
                        "logo",
                        data.logo_url,
                        data.removed_media
                      )
                        ? 0.5
                        : 1,
                    }}
                  />
                </div>
              )}
      
              {/* New logo */}
              {data.logo_file && (
                <div>
      
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      color: "#16a34a",
                    }}
                  >
                    New logo
                  </div>
      
                  <img
                    src={URL.createObjectURL(data.logo_file)}
                    alt="New logo"
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "2px solid #16a34a",
                    }}
                  />
                </div>
              )}
      
            </div>
          </div>
        )}
      
        {/* COVER */}
        {(data.cover_image_url || data.cover_file) && (
          <div style={{ marginBottom: 24 }}>
      
            <strong>Cover image:</strong>
      
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
      
              {/* Current cover */}
              {data.cover_image_url && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
              
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      minHeight: 18,
                      color: isRemoved(
                        "cover",
                        data.cover_image_url,
                        data.removed_media
                      )
                        ? "#ef4444"
                        : "#64748b",
                      fontWeight: isRemoved(
                        "cover",
                        data.cover_image_url,
                        data.removed_media
                      )
                        ? 600
                        : 500,
                    }}
                  >
                    {isRemoved(
                      "cover",
                      data.cover_image_url,
                      data.removed_media
                    )
                      ? "Marked for removal"
                      : "Current image"}
                  </div>
              
                  <img
                    src={data.cover_image_url}
                    alt="Current cover"
                    style={{
                      width: 180,
                      borderRadius: 10,
                      border: isRemoved(
                        "cover",
                        data.cover_image_url,
                        data.removed_media
                      )
                        ? "3px solid #ef4444"
                        : "1px solid #cbd5e1",
                      opacity: isRemoved(
                        "cover",
                        data.cover_image_url,
                        data.removed_media
                      )
                        ? 0.5
                        : 1,
                    }}
                  />
                </div>
              )}
      
              {/* New cover */}
              {data.cover_file && (
                <div>
      
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      color: "#16a34a",
                    }}
                  >
                    New cover
                  </div>
      
                  <img
                    src={URL.createObjectURL(data.cover_file)}
                    alt="New cover"
                    style={{
                      width: 180,
                      borderRadius: 10,
                      border: "2px solid #16a34a",
                    }}
                  />
                </div>
              )}
      
            </div>
          </div>
        )}
      
        {/* GALLERY */}
        {(
          (Array.isArray(data.gallery) &&
            data.gallery.length > 0) ||
          (Array.isArray(data.gallery_files) &&
            data.gallery_files.length > 0)
        ) && (
          <div style={{ marginBottom: 24 }}>
      
            <strong>Gallery images:</strong>
      
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
      
              {/* Existing gallery */}
              {Array.isArray(data.gallery) &&
                data.gallery.map((img, idx) => {
      
                  const removed = isRemoved(
                    "gallery",
                    img.url,
                    data.removed_media
                  );
      
                  return (
                    <div key={`existing-${idx}`} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", }}>
                      <div
                        style={{
                          fontSize: 11,
                          marginBottom: 6,
                          minHeight: 18,
                          color: removed
                            ? "#ef4444"
                            : "#64748b",
                          fontWeight: removed
                            ? 600
                            : 500,
                        }}
                      >
                        {removed
                          ? "Marked for removal"
                          : "Current image"}
                      </div>
                      <img
                        src={img.url}
                        alt=""
                        style={{
                          width: 90,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: removed
                            ? "3px solid #ef4444"
                            : "1px solid #cbd5e1",
                          opacity: removed
                            ? 0.5
                            : 1,
                        }}
                      />
                    </div>
                  );
      
                })}
      
              {/* New gallery uploads */}
              {Array.isArray(data.gallery_files) &&
                data.gallery_files.map(
                  (file, idx) => (
                    <div key={`new-${idx}`} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",}}>      
                      <div
                        style={{
                          fontSize: 11,
                          marginBottom: 6,
                          color: "#16a34a",
                        }}
                      >
                        New image
                      </div>
      
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{
                          width: 90,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                          border:
                            "2px solid #16a34a",
                        }}
                      />
                    </div>
                  )
                )}
      
            </div>
          </div>
        )}
      
        {/* VISIBILITY */}
        <div style={{ marginBottom: 18 }}>
      
          <strong>Visibility settings:</strong>
      
          <div style={{ marginTop: 8 }}>
      
            <div>
              {data.is_public
                ? "✓ Public profile enabled"
                : "✗ Public profile disabled"}
            </div>
      
            <div>
              {data.allow_reviews
                ? "✓ Reviews allowed"
                : "✗ Reviews disabled"}
            </div>
      
          </div>
        </div>
      
        {/* COMPLIANCE */}
        {!isAdminEdit && (
          <div>
            <strong>
              {isUserUpdate
                ? "Update request confirmation:"
                : "Business ownership confirmation:"}
            </strong>
        
            <div style={{ marginTop: 8 }}>
              <div>
                {data.owner_confirmed
                  ? "✓ Confirmation completed"
                  : "✗ Confirmation not completed"}
              </div>
            </div>
          </div>
        )}
      
      </Section>

      {isAdminEdit && (
        <Section title="Update Authorization">
          <p
            style={{
              marginBottom: 16,
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: 1.7,
            }}
          >
            Was this business update requested through an existing ticket?
          </p>
      
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="change_source_type"
              value="ticket"
              checked={normalizedChangeSource === "ticket"}
              onChange={() => setChangeSourceType("ticket")}
            />
      
            <span>
              Yes, I have a pending update ticket.
            </span>
          </label>
      
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="change_source_type"
              value="admin_note"
              checked={normalizedChangeSource === "admin_note"}
              onChange={() => setChangeSourceType("admin_note")}
            />
      
            <span>
              No, this is an admin-initiated update.
            </span>
          </label>
      
          {normalizedChangeSource === "ticket" && (
            <div style={{ marginTop: 18 }}>
              <label className="admin-label">
                Ticket code *
              </label>
      
              <input
                type="text"
                className="admin-input"
                value={data.ticket_code || ""}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    ticket_code: event.target.value,
                  }))
                }
                placeholder="e.g. IC-BU-000123"
                autoComplete="off"
              />
      
              <p className="admin-hint mt-2">
                Only a pending update ticket for this business can be used.
              </p>
            </div>
          )}
      
          {normalizedChangeSource === "admin_note" && (
            <div style={{ marginTop: 18 }}>
              <label className="admin-label">
                Admin note / reason for update *
              </label>
      
              <textarea
                className="admin-input"
                rows={4}
                value={data.admin_note || ""}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    admin_note: event.target.value,
                  }))
                }
                placeholder="Explain why this direct administrative update is being made."
              />
      
              <p className="admin-hint mt-2">
                This note will be permanently stored in the business change audit.
              </p>
            </div>
          )}
      
          {!isValidAdminEditAuthorization && (
            <p className="text-red-500 text-sm mt-4">
              Select an authorization method and complete the required field before
              submitting this update.
            </p>
          )}
        </Section>
      )}

      {loading && (
        <div
          style={{
            marginTop: 24,
            marginBottom: 10,
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(64,224,208,0.12)",
            border: "1px solid rgba(64,224,208,0.45)",
            color: "var(--text)",
            fontWeight: 500,
            lineHeight: 1.7,
          }}
        >
          <strong>{previewCopy.loadingTitle}</strong>

          <div style={{ marginTop: 4 }}>
            {previewCopy.loadingText}
          </div>
        </div>
      )}

      {submitMessage && (

        <div
          style={{
            marginTop: 24,
            marginBottom: 10,
            padding: "14px 16px",
            borderRadius: 12,
            background:
              submitError
                ? "rgba(239,68,68,0.12)"
                : "rgba(34,197,94,0.12)",
            border:
              submitError
                ? "1px solid rgba(239,68,68,0.35)"
                : "1px solid rgba(34,197,94,0.35)",
            color:
              submitError
                ? "#dc2626"
                : "#15803d",
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
      
          <div>
            {submitError ? "❌ " : "✅ "}
            {submitMessage}
          </div>
      
          {!submitError && ticketCode && (
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Ticket Code: {ticketCode}
            </div>
          )}
      
        </div>
      
      )}

      {/* ─────────────────────────
         ACTIONS
      ───────────────────────── */}
      <div className="flex justify-between mt-8">
        <button
          className="admin-btn admin-btn-secondary"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className="admin-btn admin-btn-primary"
          onClick={handleFinalSubmit}
          disabled={isSubmitDisabled}
          style={
            isSubmitDisabled
              ? {
                  opacity: 0.5,
                  cursor: "not-allowed",
                  boxShadow: "none",
                }
              : undefined
          }
        >
          {loading
            ? previewCopy.loadingLabel
            : previewCopy.submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────
   Helper Components
───────────────────────── */
function Section({ title, children }) {
  return (
    <div
      style={{
        paddingBottom: 28,
        marginBottom: 28,
        borderBottom: "1px solid var(--border-color, rgba(148, 163, 184, 0.35))",
        paddingTop: 4,
      }}
    >
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 18,
          color: "var(--text)",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Item({ label, value, multiline }) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return (
    <div>
      <strong>{label}:</strong>{" "}

      {multiline ? (
        <div
          style={{
            whiteSpace: "pre-line",
            marginTop: 4,
          }}
        >
          {value}
        </div>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
