// frontend/components/IntroCards.js
import { useRouter } from "next/router";

export default function IntroCards() {
  const router = useRouter();

  const cards = [
    {
      title: "Health & Medicine",
      videoSrc: "/animation1.mp4",   // همان ترتیب که گفتی
      delayClass: "card-1",
      onClick: () => router.push("/?category=doctor&limit=10"),
    },
    {
      title: "Translate & Interpreter",
      videoSrc: "/animation2.mp4",
      delayClass: "card-2",
      onClick: () =>
        router.push("/?category=language-services&limit=10"),
    },
    {
      title: "Lawyer",
      videoSrc: "animation3.mp4",
      delayClass: "card-3",
      onClick: () => router.push("/?category=lawyer&limit=10"),
    },
    {
      title: "About Us",
      videoSrc: "animation4.mp4",
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
          {/* ویدیو یا گیف داخل کارت */}
          <div className="intro-card-media">
            <video
              src={card.videoSrc}
              autoPlay
              loop
              muted
              playsInline
            />
          </div>

          {/* متن کارت */}
          <div className="intro-card-text">
            <p>{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
