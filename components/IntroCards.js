// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards() {
  const router = useRouter();

  const buttons = [
    { title: "About Us", onClick: () => router.push("/about") },
    { title: "Health & Medicine", onClick: () => router.push("/?category=doctor&limit=10") },
    { title: "Translate & Interpreter", onClick: () => router.push("/?category=language-services&limit=10") },
    { title: "Lawyer", onClick: () => router.push("/?category=lawyer&limit=10") },
  ];

  return (
    <div className="intro-buttons-container">
      {buttons.map((btn, i) => (
        <button
          key={i}
          className={`intro-vertical-btn slide-up card-${i + 1}`}
          onClick={btn.onClick}
        >
          {btn.title}
        </button>
      ))}
    </div>
  );
}
