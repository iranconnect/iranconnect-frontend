// frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 2000), // fade-out welcome
      setTimeout(() => setStep(3), 4500), // zoom-in
      setTimeout(() => setStep(4), 7100), // move-top-left
      setTimeout(() => setStep(5), 9000), // show grid buttons
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const logoClass =
    step === 1 ? "hidden"
    : step === 2 ? "intro-logo zoom-in"
    : step === 3 ? "intro-logo zoom-in"
    : step === 4 ? "intro-logo move-top-left"
    : "intro-logo final-top-left";

  return (
    <div className="intro-master">
      
      {/* مرحله Welcome */}
      {step === 1 && (
        <p className="intro-welcome fade-in-out">
          Everything you need, one community — IranConnect
        </p>
      )}

      {/* لوگو موشن */}
      {step >= 2 && (
        <div className={logoClass}>
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله نهایی: نمایش جدول دکمه‌ها */}
      {step === 5 && <IntroCards logoReady={true} />}

    </div>
  );
}
