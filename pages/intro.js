import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 2000),  // fade-in welcome
      setTimeout(() => setStep(3), 4500),  // zoom-in logo
      setTimeout(() => setStep(4), 7100),  // move logo to top-left
      setTimeout(() => setStep(5), 9000),  // show grid/buttons
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

      {/* مرحله نهایی: نمایش جدول + لوگو در سلول */}
      {step === 5 && <IntroCards logoClass={logoClass} />}
    </div>
  );
}
