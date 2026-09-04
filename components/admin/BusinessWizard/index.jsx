//components/admin/BusinessWizard/index.jsx
import { useEffect, useState } from "react";
import StepBasicInfo from "./StepBasicInfo";
import StepServicesTags from "./StepServicesTags";
import StepLocationContact from "./StepLocationContact";
import StepMediaReview from "./StepMediaReview";
import StepPreviewSubmit from "./StepPreviewSubmit";
import DuplicateModal from "../DuplicateModal";
import apiClient from "../../../utils/apiClient";

const STEPS = [
  "basic",
  "services",
  "location",
  "review",
  "preview",
];

export default function BusinessWizard({
  mode = "admin-create",
  initialData = null,
  onSubmit: externalSubmit = null,
  onSubmissionSuccess = null,
}) {
  const [step, setStep] = useState(0);
  const [duplicate, setDuplicate] = useState(null);
  const [loading, setLoading] = useState(false);

  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [rejectOpen, setRejectOpen] =
    useState(false);

  const [rejectNote, setRejectNote] =
    useState("");

  const [rejectError, setRejectError] =
    useState("");

  const [rejectLoading, setRejectLoading] =
    useState(false);

  const defaultData = {
    name: "",
    category_id: "",
    subcategory_ids: [],
  
    legal_name: "",
    business_type: "",
    year_established: "",
  
    short_description: "",
    full_description: "",
  
    services: [],
    tags: [],
  
    service_mode: "",
    availability_type: "",
    availability_note: "",
    availability_hours: null,
  
    country: "",
    country_code: "",
    city: "",
    address: "",
    postal_code: "",
  
    location_map_url: "",
    base_location_map_url: "",
  
    service_radius_km: "",
  
    phone: "",
    email: "",
    website: "",
  
    show_phone: true,
    show_email: true,
  
    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",
    twitter_url: "",
    telegram_url: "",
    whatsapp_number: "",
  
    is_public: true,
    allow_reviews: true,
  
    logo_file: null,
    cover_file: null,
    gallery_files: [],
  
    // EXISTING MEDIA
    logo_url: "",
    cover_image_url: "",
    gallery: [],
  
    // REMOVE SYSTEM
    removed_media: {
      logo: [],
      cover: [],
      gallery: [],
    },
  
    force_create: false,

    // ADMIN EDIT AUTHORIZATION
    change_source_type: "",
    ticket_code: "",
    admin_note: "",
  };
  
  const [data, setData] = useState(() => ({
    ...defaultData,
    ...(initialData || {}),
  }));

  useEffect(() => {

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  
  }, [step]);

  useEffect(() => {
    if (!initialData) return;
  
    setData((prev) => ({
      ...prev,
      ...initialData,
    }));
  }, [initialData]);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function rejectTicketRequest() {
    if (mode !== "admin-create-ticket") {
      return;
    }

    const requestId =
      Number(data.business_request_id);

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      setRejectError(
        "Invalid business request context."
      );
      return;
    }

    const note =
      String(rejectNote || "").trim();

    if (!note) {
      setRejectError(
        "Admin note is required."
      );
      return;
    }

    setRejectLoading(true);
    setRejectError("");

    try {
      await apiClient.put(
        `/admin/requests/${requestId}/status`,
        {
          status: "rejected",
          admin_note: note,
        },
        {
          withCredentials: true,
          headers: {
            "x-iranconnect-admin": "1",
          },
        }
      );

      window.dispatchEvent(
        new Event(
          "iranconnect:business-request-changed"
        )
      );

      window.location.href =
        "/admin/requests";
    } catch (err) {
      setRejectError(
        err?.response?.data?.error ||
        "Unable to reject this request."
      );
    } finally {
      setRejectLoading(false);
    }
  }

  async function submit(submitData = data) {
    if (externalSubmit) {
      setSubmitMessage("");
      setSubmitError(false);
      setTicketCode("");
      setSubmitSuccess(false);
      setLoading(true);
  
      try {
        const res = await externalSubmit(submitData);
  
        if (
          mode === "user-update" ||
          mode === "user-new"
        ) {
          const isNewBusinessRequest =
            mode === "user-new";
        
          setSubmitError(false);
        
          setSubmitMessage(
            isNewBusinessRequest
              ? "Your new business request has been submitted successfully. Our team will review it before it is published."
              : "Your update request has been submitted successfully. Your secure media archive has been created."
          );
        
          setTicketCode(
            res?.data?.ticket_code || ""
          );
        
          setSubmitSuccess(true);
        
          if (typeof onSubmissionSuccess === "function") {
            window.setTimeout(() => {
              onSubmissionSuccess({
                ticketCode: res?.data?.ticket_code || "",
              });
            }, 3500);
          }
        }
        
        if (mode === "admin-edit") {
          setSubmitError(false);
        
          setSubmitMessage(
            "Business updated successfully. Redirecting to businesses..."
          );
        
          setTicketCode("");
          setSubmitSuccess(true);
        
          if (typeof onSubmissionSuccess === "function") {
            onSubmissionSuccess({
              businessId: res?.data?.business_id || null,
              slug: res?.data?.slug || "",
            });
          }
        }
  
        return res;
      } catch (err) {
        
  
        const status = err?.response?.status;

        if (
          process.env.NODE_ENV !== "production" &&
          (!status || status >= 500)
        ) {
          console.error(
            "Business wizard external submit failed",
            err
          );
        }
  
        const serverMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message;
  
        setSubmitError(true);
  
        if (status === 409) {
          if (mode === "admin-edit") {
            setDuplicate(err.response?.data || null);
            return;
          }
        
          setSubmitMessage(
            serverMessage ||
            "You already have a pending request for this business."
          );
        
          return;
        }
  
        if (status === 429) {
          setSubmitMessage(
            serverMessage ||
            "You recently submitted a similar request. Please wait before submitting again."
          );
  
          return;
        }
  
        if (status === 403) {
          setSubmitMessage(
            serverMessage ||
            "You do not have permission to perform this action."
          );
  
          return;
        }
  
        if (status === 400) {
          setSubmitMessage(
            serverMessage ||
            "Some submitted data is invalid."
          );
  
          return;
        }
  
        if (status >= 500) {
          setSubmitMessage(
            serverMessage ||
            "The request could not be completed. Please try again later."
          );
  
          return;
        }
  
        setSubmitMessage(
          serverMessage ||
          "Something went wrong while submitting your request."
        );
      } finally {
        setLoading(false);
      }
  
      return;
    }
  
    setSubmitMessage("");
    setSubmitError(false);
    setTicketCode("");
    setSubmitSuccess(false);
  
    setLoading(true);
  
    try {
      const cleanedData = {
        ...data,
        availability_hours:
          data.availability_type === "business_hours"
            ? data.availability_hours
            : null,
      };

      /*
       * F15-20A — Ticket media displayed in the wizard is
       * presentation-only context.
       *
       * Request-bound business creation must resolve immutable
       * business_request_assets server-side from the request ID.
       * Never send archived media URLs back as authoritative
       * business media input.
       */
      if (mode === "admin-create-ticket") {
        delete cleanedData.logo_url;
        delete cleanedData.cover_image_url;
        delete cleanedData.gallery;
        delete cleanedData.logo;
        delete cleanedData.cover;
        delete cleanedData.removed_media;
      }
  
      const form = new FormData();
  
      Object.entries(cleanedData).forEach(([k, v]) => {
        if (k === "gallery_files" && Array.isArray(v)) {
          v.forEach((file) => {
            form.append("gallery_files", file);
          });
          return;
        }
  
        if (k === "logo_file" || k === "cover_file") {
          if (v) form.append(k, v);
          return;
        }
  
        if (Array.isArray(v)) {
          form.append(k, JSON.stringify(v));
          return;
        }
  
        if (typeof v === "object" && v !== null) {
          form.append(k, JSON.stringify(v));
          return;
        }
  
        if (v !== null && v !== undefined) {
          form.append(k, v);
        }
      });
  
      const endpoint =
        mode === "user-update"
          ? "/requests"
          : mode === "admin-create-ticket"
            ? `/admin/businesses/requests/${data.business_request_id}/create-v2`
            : "/admin/businesses/create-v2";
      
      const res = await apiClient.post(
        endpoint,
        form,
        {
          timeout: 120000,
        }
      );
  
      if (mode === "user-update") {

        setSubmitError(false);
      
        setSubmitMessage(
          "Business update request submitted successfully."
        );
      
        setTicketCode(
          res?.data?.ticket_code || ""
        );
        setSubmitSuccess(true);

            
        return;
      }
      
      const createdSlug = res?.data?.slug;
      
      if (!createdSlug) {
        throw new Error(
          "Business created but slug was not returned."
        );
      }

      if (mode === "admin-create-ticket") {
        setSubmitError(false);

        setSubmitMessage(
          "Business created and linked to the request successfully. The request still requires a separate approval decision."
        );

        setSubmitSuccess(true);

        window.setTimeout(() => {
          window.location.href =
            "/admin/requests";
        }, 1800);

        return;
      }
      
      window.location.href =
        `/business/${createdSlug}`;
  
    } catch (err) {

      if (process.env.NODE_ENV !== "production") {
        console.error(
          "Business wizard submit failed",
          err
        );
      }
    
      const status =
        err?.response?.status;
    
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message;
    
      // ====================================
      // DUPLICATE
      // ====================================
      if (status === 409) {
    
        setDuplicate(
          err.response.data
        );
    
        return;
      }
    
      // ====================================
      // RATE LIMIT
      // ====================================
      if (status === 429) {
    
        setSubmitError(true);
        
        setSubmitMessage(
          serverMessage ||
          "You recently submitted a similar request. Please wait before submitting again."
        );
    
        return;
      }
    
      // ====================================
      // FORBIDDEN
      // ====================================
      if (status === 403) {
    
        setSubmitError(true);
        
        setSubmitMessage(
          serverMessage ||
          "You do not have permission to perform this action."
        );
    
        return;
      }
    
      // ====================================
      // VALIDATION
      // ====================================
      if (status === 400) {
    
        setSubmitError(true);
        
        setSubmitMessage(
          serverMessage ||
          "Some submitted data is invalid."
        );
    
        return;
      }
    
      // ====================================
      // SERVER ERROR
      // ====================================
      if (status >= 500) {
    
        setSubmitError(true);
        
        setSubmitMessage(
          serverMessage ||
          "Server error. Please try again later."
        );
    
        return;
      }
    
      // ====================================
      // FALLBACK
      // ====================================
      setSubmitError(true);
      
      setSubmitMessage(
        serverMessage ||
        "Something went wrong while submitting."
      );
    
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {mode === "admin-create-ticket" && (
        <div className="admin-card mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                Ticket review workflow
              </div>

              <div className="admin-hint mt-1">
                Reject the request at any step if the submitted
                information cannot be accepted.
              </div>
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={
                loading ||
                rejectLoading
              }
              onClick={() => {
                setRejectOpen(true);
                setRejectNote("");
                setRejectError("");
              }}
            >
              Reject Request
            </button>
          </div>
        </div>
      )}

      {step === 0 && (
        <StepBasicInfo data={data} setData={setData} onNext={next} mode={mode} initialData={initialData} />
      )}

      {step === 1 && (
        <StepServicesTags
          data={data}
          setData={setData}
          onNext={next}
          onBack={back}
          mode={mode}
        />
      )}

      {step === 2 && (
        <StepLocationContact
          data={data}
          setData={setData}
          onNext={next}
          onBack={back}
          mode={mode}
        />
      )}

      {step === 3 && (
        <StepMediaReview
          data={data}
          setData={setData}
          onBack={back}
          onNext={next}
          mode={mode}
        />
      )}

      {step === 4 && (
        <StepPreviewSubmit
          data={data}
          setData={setData}
          onBack={back}
          onSubmit={submit}
          loading={loading}
          mode={mode}
          submitMessage={submitMessage}
          submitError={submitError}
          ticketCode={ticketCode}
          submitSuccess={submitSuccess}
        />
      )}


      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (!rejectLoading) {
              setRejectOpen(false);
            }
          }}
        >
          <div
            className="admin-card w-full max-w-lg"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 className="admin-title">
              Reject Business Request
            </h3>

            <p className="admin-hint mt-2">
              Add an administrative note explaining why this
              request is being rejected.
            </p>

            <textarea
              className="admin-input min-h-[120px] mt-4"
              value={rejectNote}
              disabled={rejectLoading}
              placeholder="Enter admin note..."
              onChange={(event) => {
                setRejectNote(
                  event.target.value
                );
                setRejectError("");
              }}
            />

            {rejectError && (
              <p className="admin-error mt-3">
                {rejectError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={rejectLoading}
                onClick={() => {
                  setRejectOpen(false);
                  setRejectNote("");
                  setRejectError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-primary bg-red-600 hover:bg-red-700 text-white"
                disabled={rejectLoading}
                onClick={rejectTicketRequest}
              >
                {rejectLoading
                  ? "Rejecting..."
                  : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicate && (
        <DuplicateModal
          data={duplicate}
          mode={mode}
          onCancel={() => setDuplicate(null)}
          onForce={() => {
            const forcedData = {
              ...data,
              force_update: true,
            };
          
            setDuplicate(null);
            setData(forcedData);
          
            submit(forcedData);
          }}
        />
      )}
    </>
  );
}
