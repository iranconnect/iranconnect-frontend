// components/LegalLayout.js
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import LanguageToggle from "./LanguageToggle";
import Header from "./Header";
import Footer from "./Footer";

export default function LegalLayout({ texts }) {
  const [lang, setLang] = useState("en");

  /* =====================================================
     🔐 Sanitize legal HTML (Defense in Depth)
     - Prevent XSS
     - Allow only safe legal content tags
  ===================================================== */
  const safeHTML = useMemo(() => {
    const raw = texts?.[lang] || "";

    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "blockquote",
        "a",
        "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "style"],
      FORBID_TAGS: ["script", "iframe", "object", "embed"],
      FORBID_ATTR: [
        "onerror",
        "onclick",
        "onload",
        "onmouseover",
        "onfocus",
      ],
    });
  }, [texts, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0a1a44]">
      <Header />

      <main
        className="flex-grow container mx-auto px-6 pt-10 pb-32"
        style={{
          direction: lang === "fa" ? "rtl" : "ltr",
          textAlign: lang === "fa" ? "right" : "left",
        }}
      >
        <LanguageToggle onChange={setLang} />

        <div
          className="prose max-w-none leading-relaxed mb-10"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </main>

      <Footer />
    </div>
  );
}
