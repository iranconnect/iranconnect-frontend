// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards() {
  const router = useRouter();

  const cards = [
    {
      title: "Health & Medicine",
      gif: "/animation1.gif",
      icon: "/icons/health.svg",
      delayClass: "card-1",
      onClick: () => router.push("/?category=doctor&limit=10"),
    },
    {
      title: "Translate & Interpreter",
      gif: "/animation2.gif",
      icon: "/icons/translate.svg",
      delayClass: "card-2",
      onClick: () => router.push("/?category=language-services&limit=10"),
    },
    {
      title: "Lawyer",
      gif: "/animation3.gif",
      icon: "/icons/lawyer.svg",
      delayClass: "card-3",
      onClick: () => router.push("/?category=lawyer&limit=10"),
    },
    {
      title: "About Us",
      gif: "/animation4.gif",
      icon: "/icons/about.svg",
      delayClass: "card-4",
      onClick: () => router.push("/about"),
    },
  ];

  return (
    <div className="intro-cards-wrapper">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`intro-card slide-up ${card.delayClass}`}
          onClick={card.onClick}
        >
          {/* آیکون سمت چپ */}
          <div className="intro-card-icon">
            <img src={card.icon} alt={card.title} />
          </div>

          {/* متن کارت */}
          <div className="intro-card-text">
            <p>{card.title}</p>
          </div>

          {/* گیف در سمت راست */}
          <div className="intro-card-media">
            <img src={card.gif} alt={card.title} />
          </div>
        </div>
      ))}
    </div>
  );
}
