// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards({ showLogo, showButtons, onButtonClick }) {
  const buttons = [
    { title: "About Us", gif: "/animation/1.gif" },
    { title: "Health & Medicine", gif: "/animation/2.gif" },
    { title: "Translator & Interpreter", gif: "/animation/3.gif" },
    { title: "Lawyer", gif: "/animation/4.gif" },
  ];

  return (
    <div className="intro-grid-wrapper">
      {/* ردیف اول — لوگو */}
      <div className="logo-space">
        {showLogo && (
          <div className="intro-logo fade-in-logo">
            <img src="/IranConnect Dark.gif" alt="IranConnect" />
            <h1>IRANCONNECT</h1>
          </div>
        )}
      </div>

      {/* دکمه‌ها */}
      {buttons.map((btn, index) => (
        <button
          key={index}
          className={`grid-btn btn-${index + 1} ${showButtons ? "show-btn" : ""}`}
          onClick={() => onButtonClick(btn.title)} // فراخوانی تابع برای ریدایرکت
        >
          <img className="btn-gif" src={btn.gif} alt={btn.title} />
          <span className="btn-title">{btn.title}</span>
        </button>
      ))}

      {/* ردیف مخفی برای فضای اضافی */}
      <div className="hidden-row"></div>
    </div>
  );
}
