// pages/about.js
import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import LegalLayout from "../components/LegalLayout";

/**
 * 🔐 Static trusted content (sanitized defensively)
 * SSR-safe using isomorphic-dompurify
 */

const rawTexts = {
  en: `
    <h1>About IranConnect</h1>
    <p><strong>IranConnect – Bridging Iranians Across Borders</strong></p>

    <p>IranConnect was created with one heartfelt mission — to help Iranians living abroad find trusted professionals from their own community.</p>

    <p>For many Iranians who have moved far from home, adapting to life in a new country can be overwhelming.</p>

    <p>IranConnect makes this journey easier by connecting you with Iranian professionals and service providers around the world.</p>

    <p>Beyond a simple directory, IranConnect is a community-driven platform built on trust, empathy, and cultural connection.</p>

    <p>Through this network, we aim to strengthen the bonds between Iranians abroad.</p>
  `,

  fr: `
    <h1>À propos d’IranConnect</h1>
    <p><strong>IranConnect – Relier les Iraniens à travers les frontières</strong></p>

    <p>IranConnect a été créé avec une mission sincère.</p>

    <p>Nous facilitons la mise en relation avec des professionnels iraniens partout dans le monde.</p>

    <p>IranConnect est une plateforme communautaire fondée sur la confiance et le lien culturel.</p>
  `,

  fa: `
    <h1>درباره ایران‌کانکت</h1>
    <p><strong>IranConnect – پلی میان ایرانیان در سراسر جهان</strong></p>

    <p>ایران‌کانکت برای کمک به ایرانیان خارج از کشور ایجاد شده است.</p>

    <p>هدف ما ایجاد ارتباطی مطمئن میان متخصصان ایرانی در سراسر دنیاست.</p>
  `,
};

export default function AboutPage() {
  const safeTexts = useMemo(() => {
    const sanitized = {};
    for (const lang in rawTexts) {
      sanitized[lang] = DOMPurify.sanitize(rawTexts[lang], {
        USE_PROFILES: { html: true },
      });
    }
    return sanitized;
  }, []);

  return <LegalLayout texts={safeTexts} />;
}
