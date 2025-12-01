// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards({ logoClass }) {
  const router = useRouter();

  return (
    <div className="intro-grid-wrapper show-grid">

      {/* ستون ۱ — ردیف ۱ (لوگو) */}
      <div className="logo-space">
        <div className={logoClass}>
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      </div>

      {/* ستون ۱ — ردیف ۲ */}
      <button className="grid-btn btn-1 slide-up" onClick={() => router.push("/about")}>
        <span className="btn-title">About Us</span>
      </button>

      {/* ستون ۲ */}
      <button className="grid-btn btn-2 slide-up" onClick={() => router.push("/?category=doctor&limit=10")}>
        <span className="btn-title">Health & Medicine</span>
      </button>

      {/* ستون ۳ */}
      <button className="grid-btn btn-3 slide-up" onClick={() => router.push("/?category=language-services&limit=10")}>
        <span className="btn-title">Translator & Interpreter</span>
      </button>

      {/* ستون ۴ */}
      <button className="grid-btn btn-4 slide-up" onClick={() => router.push("/?category=lawyer&limit=10")}>
        <span className="btn-title">Lawyer</span>
      </button>

    </div>
  );
}
