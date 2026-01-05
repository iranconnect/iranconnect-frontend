//components/admin/BusinessWizard/index.jsx
import { useState } from "react";
import StepBasicInfo from "./StepBasicInfo";
import StepServicesTags from "./StepServicesTags";
import StepLocationContact from "./StepLocationContact";
import StepMediaReview from "./StepMediaReview";
import WizardFooter from "./WizardFooter";
import DuplicateModal from "../DuplicateModal";
import apiClient from "../../../utils/apiClient";

const STEPS = [
  "basic",
  "services",
  "location",
  "review",
];

export default function BusinessWizard() {
  const [step, setStep] = useState(0);
  const [duplicate, setDuplicate] = useState(null);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
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
  
    country: "",
    city: "",
    address: "",
    postal_code: "",
    location: "",
  
    phone: "",
    email: "",
    website: "",
  
    image: null,
    force_create: false,
  });


  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setLoading(true);

    try {
      const form = new FormData();

      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          form.append(k, JSON.stringify(v));
        } else if (v !== null) {
          form.append(k, v);
        }
      });

      const res = await apiClient.post(
        "/admin/businesses/create-v2",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );


      window.location.href =
        `/admin/businesses/${res.data.business_id}`;

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
        />
      )}

      {step === 3 && (
        <StepMediaReview
          data={data}
          setData={setData}
          onBack={back}
          onNext={submit}
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
