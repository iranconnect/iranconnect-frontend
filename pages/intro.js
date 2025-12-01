// frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    setTimeout(() => setStep(2), 3500);
    setTimeout(() => setStep(3), 6500);
    setTimeout(() => setStep(4), 8200);
  }, []);

  // ⭐ یک لوگو، با کلاس داینامیک
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

      {/* لوگو ثابت — فقط استایل تغییر می‌کند */}
      {step >= 2 && (
        <div className={logoClass}>
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله نهایی — نمایش کارت‌ها */}
      {step === 4 && <IntroCards />}
    </div>
  );
}
