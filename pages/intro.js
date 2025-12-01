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

  return (
    <div className="intro-master">

      {/* مرحله ۱ — متن Welcome */}
      {step === 1 && (
        <p className="intro-welcome fade-in">
          Everything you need, one community — IranConnect
        </p>
      )}

      {/* مرحله ۲ — لوگو Zoom-in */}
      {step === 2 && (
        <div className="intro-logo zoom-in">
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۳ — انتقال لوگو */}
      {step === 3 && (
        <div className="intro-logo move-top-left">
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* حالت نهایی لوگو */}
      {step === 4 && (
        <div className="intro-logo final-top-left">
          <img src="/IranConnect Dark.gif" alt="IranConnect" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* کارت‌ها */}
      {step === 4 && <IntroCards />}
    </div>
  );
}
