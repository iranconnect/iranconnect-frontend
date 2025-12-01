// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards() {
  const router = useRouter();

  const cards = [
    {
      title: "About Us",
      gif: "/animation4.gif",
      icon: "/icons/about.svg",
      small: true,          // 20% smaller
      delay: "card-1",
      onClick: () => router.push("/about"),
    },
    {
      title: "Health & Medicine",
      gif: "/animation1.gif",
      icon: "/icons/health.svg",
      delay: "card-2",
      onClick: () => router.push("/?category=doctor&limit=10"),
    },
    {
      title: "Translate & Interpreter",
      gif: "/animation2.gif",
      icon: "/icons/translate.svg",
      delay: "card-3",
      onClick: () => router.push("/?category=language-services&limit=10"),
    },
    {
      title: "Lawyer",
      gif: "/animation3.gif",
      icon: "/icons/lawyer.svg",
      delay: "card-4",
      onClick: () => router.push("/?category=lawyer&limit=10"),
    },
  ];

  return (
    <div className="intro-cards-wrapper">

      {/* ⭐ Desktop Version — Bottom-Aligned */}
      <div className="intro-cards-desktop">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`intro-card slide-up ${card.delay} ${
              card.small ? "card-small" : ""
            }`}
            onClick={card.onClick}
          >
            <img src={card.gif} className="intro-card-gif" alt={card.title} />
            <img src={card.icon} className="intro-card-icon" alt={card.title} />
            <p className="intro-card-title">{card.title}</p>
          </div>
        ))}
      </div>

      {/* ⭐ Mobile Version — Vertical Stacked Cards */}
      <div className="intro-cards-mobile">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`intro-card-mobile slide-up ${card.delay}`}
            onClick={card.onClick}
          >
            <img className="intro-card-mobile-gif" src={card.gif} alt={card.title}/>
            <img className="intro-card-mobile-icon" src={card.icon} alt={card.title}/>
            <p className="intro-card-mobile-title">{card.title}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
