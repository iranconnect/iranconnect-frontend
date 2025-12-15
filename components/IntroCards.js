// frontend/components/IntroCards.js

export default function IntroCards({ showLogo, showButtons, onButtonClick }) {

  const buttons = [
    { title: "About Us", gif: "/animation/1.gif" },
    { title: "Health & Medicine", gif: "/animation/2.gif" },
    { title: "Translator & Interpreter", gif: "/animation/3.gif" },
    { title: "Lawyer", gif: "/animation/4.gif" },
  ];

  return (
    <div className="intro-grid-wrapper">

      {/* LOGO */}
      {showLogo && (
        <div className="logo-space fade-in-logo">
          <div className="intro-logo">
            <img src="/IranConnect Dark.gif" alt="IranConnect" />
            <h1>IRANCONNECT</h1>
          </div>
        </div>
      )}

      {/* CARDS ROW */}
      <div className="cards-row">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            className={`grid-btn ${showButtons ? "show-btn" : ""}`}
            onClick={() => onButtonClick(btn.title)}
          >
            <img className="btn-gif" src={btn.gif} alt={btn.title} />
            <span className="btn-title">{btn.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
