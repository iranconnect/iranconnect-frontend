// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards({ logoReady }) {
  const router = useRouter();

  const buttons = [
    { title: "About Us", onClick: () => router.push("/about") },
    { title: "Health & Medicine", onClick: () => router.push("/?category=doctor&limit=10") },
    { title: "Translator & Interpreter", onClick: () => router.push("/?category=language-services&limit=10") },
    { title: "Lawyer", onClick: () => router.push("/?category=lawyer&limit=10") },
  ];

  return (
    <div className={`intro-grid-wrapper ${logoReady ? "show-grid" : ""}`}>
      
      {/* ستون ۱ — ردیف ۱: فضای لوگو */}
      <div className="grid-cell logo-space"></div>

      {/* ستون ۱ — ردیف ۲ */}
      <button className="grid-btn btn-1 slide-up" onClick={buttons[0].onClick}>
        {buttons[0].title}
      </button>

      {/* ستون ۲ — تک سلولی */}
      <button className="grid-btn btn-2 slide-up" onClick={buttons[1].onClick}>
        {buttons[1].title}
      </button>

      {/* ستون ۳ */}
      <button className="grid-btn btn-3 slide-up" onClick={buttons[2].onClick}>
        {buttons[2].title}
      </button>

      {/* ستون ۴ */}
      <button className="grid-btn btn-4 slide-up" onClick={buttons[3].onClick}>
        {buttons[3].title}
      </button>

    </div>
  );
}
