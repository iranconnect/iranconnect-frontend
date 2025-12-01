// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards({ showLogo, showButtons }) {
  const router = useRouter();

  const buttons = [
    { title: "About Us", gif: "/animation/1.gif", onClick: () => router.push("/about") },
    { title: "Health & Medicine", gif: "/animation/2.gif", onClick: () => router.push("/?category=doctor&limit=10") },
    { title: "Translator & Interpreter", gif: "/animation/3.gif", onClick: () => router.push("/?category=language-services&limit=10") },
    { title: "Lawyer", gif: "/animation/4.gif", onClick: () => router.push("/?category=lawyer&limit=10") },
  ];

  return (
    <div className="intro-grid-wrapper">

      {/* ستون ۱ — ردیف ۱ → لوگو */}
      <div className="logo-space">
        {showLogo && (
          <div className="intro-logo fade-in-logo">
            <img src="/IranConnect Dark.gif" alt="IranConnect" />
            <h1>IRANCONNECT</h1>
          </div>
        )}
      </div>

      {/* ۴ دکمه */}
      {buttons.map((btn, index) => (
        <button
          key={index}
          className={`grid-btn btn-${index + 1} ${showButtons ? "slide-up" : ""}`}
          onClick={btn.onClick}
        >
          <img className="btn-gif" src={btn.gif} alt={btn.title} />
          <span className="btn-title">{btn.title}</span>
        </button>
      ))}

    </div>
  );
}

