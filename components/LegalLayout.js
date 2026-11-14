// components/LegalLayout.js
import { useEffect, useRef, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import Header from "./Header";
import Footer from "./Footer";
import styles from "../styles/legalContent.module.css";

export default function LegalLayout({ texts, editorial = false, normalizePolicy = false }) {
  const [lang, setLang] = useState("en");

  const contentRef = useRef(null);

  useEffect(() => {
    if (!normalizePolicy || !contentRef.current) return;
    const headings = contentRef.current.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    );
    headings.forEach((heading, index) => {
      heading.classList.toggle(styles.policyTitle, index === 0);
      heading.classList.toggle(
        styles.policySectionTitle, index !== 0
      );
    });
  }, [lang, texts, normalizePolicy]);


  return (
    <div className={editorial ? `min-h-screen flex flex-col ${styles.page}` : "min-h-screen flex flex-col bg-white text-[#0a1a44]"}>
      <Header />

      <main
        className={editorial ? `flex-grow w-full max-w-5xl mx-auto px-4 md:px-2 pt-8 pb-20 ${styles.main}` : "flex-grow w-full max-w-5xl mx-auto px-4 md:px-2 pt-10 pb-32"}
        style={{
          direction: lang === "fa" ? "rtl" : "ltr",
          textAlign: editorial ? "start" : "justify",
        }}
      >
        <div className={editorial ? styles.languageBar : undefined}>
          <LanguageToggle onChange={setLang} />
        </div>
        {editorial ? <div className={styles.cardStartMarker} aria-hidden="true" /> : null}

        {/* 
          🛡️ SECURITY NOTE:
          - Content is admin-controlled
          - Sanitized at backend level
          - No runtime sanitizer in SSR (build-safe)
        */}
        <div
          ref={contentRef}
          className={editorial ? `${styles.content} ${styles.card} ${lang === "fa" ? styles.persian : ""} ${normalizePolicy ? styles.policyContent : ""}` : "prose max-w-none leading-relaxed mb-10"}
          dangerouslySetInnerHTML={{
            __html: texts?.[lang] || "",
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
