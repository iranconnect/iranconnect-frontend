// frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // مرحله‌بندی انیمیشن‌ها
    const timers = [
      setTimeout(() => setStep(2), 3500),  // Zoom-in
      setTimeout(() => setStep(3), 6500),  // Move logo
      setTimeout(() => setStep(4), 8200),  // Show cards
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // کلاس داینامیک لوگو
  const logoClass =
    step === 1 ? "hidden"
    : step === 2 ? "intro-logo zoom-in"
    : step === 3 ? "intro-logo move-top-left"
    : "intro-logo final-top-left";

  return (
    <div className="intro-master">

      {/* مرحله ۱ — متن Welcome */}
      {step === 1 && (
        <p className="intro-welcome fade-in">
          Everything you need, one community — IranConnect
        </p>
      )}

      {/* مرحله ۲، ۳، ۴ — یک لوگوی واحد با کلاس داینامیک */}
      {step >= 2 && (
        <div className={logoClass}>
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۴ — نمایش کارت‌ها */}
      {step === 4 && <IntroCards />}
      
    </div>
  );
}
