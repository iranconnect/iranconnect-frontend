// frontend/pages/cookies.js
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import LegalLayout from "../components/LegalLayout";
import apiClient from "../utils/apiClient";

const MAX_POLICY_LENGTH = 20000; // hard safety cap

export default function CookiesPolicy() {
  const [texts, setTexts] = useState({
    en: "",
    fr: "",
    fa: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function load(lang) {
      try {
        const res = await apiClient.get("/policies/cookies", {
          params: { lang },
          withCredentials: true,
        });

        let content = res.data?.content || "";

        // 🧼 Sanitize untrusted HTML from API
        content = DOMPurify.sanitize(content, {
          USE_PROFILES: { html: true },
        });

        // 🔐 Length hard limit (defensive)
        content = content.slice(0, MAX_POLICY_LENGTH);

        if (isMounted) {
          setTexts((prev) => ({
            ...prev,
            [lang]: content,
          }));
        }
      } catch (err) {
        console.warn(`⚠️ Cookies policy (${lang}) not available`);
        if (isMounted) {
          setTexts((prev) => ({
            ...prev,
            [lang]: "",
          }));
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
