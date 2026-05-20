//components/admin/BusinessWizard/index.jsx
import { useEffect, useState } from "react";
import StepBasicInfo from "./StepBasicInfo";
import StepServicesTags from "./StepServicesTags";
import StepLocationContact from "./StepLocationContact";
import StepMediaReview from "./StepMediaReview";
import StepPreviewSubmit from "./StepPreviewSubmit";
import WizardFooter from "./WizardFooter";
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
}) {
  const [step, setStep] = useState(0);
  const [duplicate, setDuplicate] = useState(null);
  const [loading, setLoading] = useState(false);

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
  };
  
  const [data, setData] = useState(() => ({
    ...defaultData,
    ...(initialData || {}),
  }));

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

  async function submit() {
    if (externalSubmit) {
      return externalSubmit(data);
    }
  
    setLoading(true);
  
    try {
      const cleanedData = {
        ...data,
        availability_hours:
          data.availability_type === "business_hours"
            ? data.availability_hours
            : null,
      };
  
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
  
      const res = await apiClient.post(
        "/admin/businesses/create-v2",
        form,
        {
          timeout: 120000,
        }
      );
  
      const createdSlug = res?.data?.slug;
  
      if (!createdSlug) {
        throw new Error("Business created but slug was not returned.");
      }
  
      window.location.href = `/business/${createdSlug}`;
  
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicate(err.response.data);
      } else {
        alert("Error creating business");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {step === 0 && (
        <StepBasicInfo data={data} setData={setData} onNext={next} />
      )}

      {step === 1 && (
        <StepServicesTags
          data={data}
          setData={setData}
          onNext={next}
          onBack={back}
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
        />
      )}

      {step === 4 && (
        <StepPreviewSubmit
          data={data}
          onBack={back}
          onSubmit={submit}
          loading={loading}
        />
      )}


      {duplicate && (
        <DuplicateModal
          data={duplicate}
          onCancel={() => setDuplicate(null)}
          onForce={() => {
            setDuplicate(null);
            setData((d) => ({ ...d, force_create: true }));
            submit();
          }}
        />
      )}
    </>
  );
}
