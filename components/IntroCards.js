// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards() {
  const router = useRouter();

  const cards = [
    {
      title: "About Us",
      gif: "/animation4.gif",
      icon: "/icons/about.svg",
      delayClass: "card-1",
      small: true,
      onClick: () => router.push("/about"),
    },
    {
      title: "Health & Medicine",
      gif: "/animation1.gif",
      icon: "/icons/health.svg",
      delayClass: "card-2",
      onClick: () => router.push("/?category=doctor&limit=10"),
    },
    {
      title: "Translate & Interpreter",
      gif: "/animation2.gif",
      icon: "/icons/translate.svg",
      delayClass: "card-3",
      onClick: () => router.push("/?category=language-services&limit=10"),
    },
    {
      title: "Lawyer",
      gif: "/animation3.gif",
      icon: "/icons/lawyer.svg",
      delayClass: "card-4",
      onClick: () => router.push("/?category=lawyer&limit=10"),
    },
  ];

  return (
    <div className="intro-cards-area">

      {/* نسخه دسکتاپ */}
      <div className="intro-cards-desktop">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`intro-card slide-up ${card.delayClass} ${
              card.small ? "card-small" : ""
            }`}
            onClick={card.onClick}
          >
            <div className="intro-card-top">
              <img className="intro-card-gif" src={card.gif} alt={card.title} />
            </div>

            <div className="intro-card-middle">
              <img className="intro-card-icon" src={card.icon} alt={card.title} />
            </div>

            <div className="intro-card-bottom">
              <p>{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* نسخه موبایل — اسکرول افقی */}
      <div className="intro-cards-mobile">
        <div className="mobile-scroll">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`intro-card-mobile slide-up ${card.delayClass}`}
              onClick={card.onClick}
            >
              <img className="intro-card-mobile-gif" src={card.gif} />
              <img className="intro-card-mobile-icon" src={card.icon} />
              <p className="intro-card-mobile-title">{card.title}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
