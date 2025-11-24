// frontend/pages/cookies.js
import { useEffect, useState } from "react";
import LegalLayout from "../components/LegalLayout";
import apiClient from "../utils/apiClient"; // ✅ اضافه شد — مشکل رفع شد

export default function CookiesPolicy() {
  const [texts, setTexts] = useState({ en: "", fr: "", fa: "" });

  useEffect(() => {
    async function load(lang) {
      try {
        // ✅ فراخوانی صحیح API
        const res = await apiClient.get("/policies/cookies", {
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
