// frontend/pages/terms-of-service.js
import { useEffect, useState } from "react";
import LegalLayout from "../components/LegalLayout";
import apiClient from "../utils/apiClient"; // ✅ اضافه شد

export default function TermsOfService() {
  const [texts, setTexts] = useState({ en: "", fr: "", fa: "" });

  useEffect(() => {
    async function load(lang) {
      try {
        const res = await apiClient.get(`/policies/terms?lang=${lang}`);
        setTexts((prev) => ({ ...prev, [lang]: res.data.content }));
      } catch (err) {
        console.warn(`No ${lang} version found`);
      }
    }

    load("en");
    load("fr");
    load("fa");
  }, []);

  return <LegalLayout texts={texts} />;
}
