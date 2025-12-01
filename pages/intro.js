// frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    // 1) متن خوشامد – 0s تا 4s
    setTimeout(() => setShowWelcome(false), 4000);

    // 2) لوگو – 4s تا 6s
    setTimeout(() => setShowLogo(true), 4200);

    // 3) کارت‌ها – بعد از 6s
    setTimeout(() => setShowCards(true), 6000);
  }, []);

  return (
    <div className="intro-container">

      {/* مرحله ۱ — متن خوش‌آمد */}
      {showWelcome && (
        <p className="intro-welcome fade-in">
          Welcome to IranConnect — bringing your needs together.
        </p>
      )}

      {/* مرحله ۲ — لوگو */}
      {showLogo && (
        <div className="intro-logo scale-in">
          <img src="/logo-dark.png" alt="IranConnect Logo" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۳ — کارت‌ها */}
      {showCards && (
        <IntroCards />
      )}
    </div>
  );
}
