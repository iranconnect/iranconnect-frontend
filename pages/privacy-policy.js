// /frontend/pages/privacy-policy.js
import { useEffect, useState } from "react";
import LegalLayout from "../components/LegalLayout";
import apiClient from "../utils/apiClient"; // ✅ axios حذف شد — apiClient اضافه شد

export default function PrivacyPolicy() {
  const [texts, setTexts] = useState({ en: "", fr: "", fa: "" });

  useEffect(() => {
    async function load(lang) {
      try {
        // ✅ فراخوانی صحیح API با ارسال کوکی HttpOnly
        const res = await apiClient.get("/policies/privacy", {
          params: { lang },
          withCredentials: true,
        });

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
