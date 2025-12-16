// frontend/pages/terms-of-service.js
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import LegalLayout from "../components/LegalLayout";
import apiClient from "../utils/apiClient"; // ✅ apiClient استفاده می‌شود

const MAX_POLICY_LENGTH = 20000; // 🔐 hard safety cap

export default function TermsOfService() {
  const [texts, setTexts] = useState({ en: "", fr: "", fa: "" });

  useEffect(() => {
    let isMounted = true;

    async function load(lang) {
      try {
        // ✅ فراخوانی API به شکل امن و یکدست
        const res = await apiClient.get("/policies/terms", {
          params: { lang },
          withCredentials: true,
        });

        let content = res.data?.content || "";

        // 🧼 Defensive sanitization (XSS-safe)
        content = DOMPurify.sanitize(content, {
          USE_PROFILES: { html: true },
        });

        // 🔐 Hard length limit (defensive)
        content = content.slice(0, MAX_POLICY_LENGTH);

        if (isMounted) {
          setTexts((prev) => ({ ...prev, [lang]: content }));
        }
      } catch (err) {
        console.warn(`No ${lang} version found`);
        if (isMounted) {
          setTexts((prev) => ({ ...prev, [lang]: "" }));
        }
      }
    }

    load("en");
    load("fr");
    load("fa");

    return () => {
      isMounted = false;
    };
  }, []);

  return <LegalLayout texts={texts} />;
}
