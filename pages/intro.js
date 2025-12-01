// frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";

export default function Intro() {
  const [step, setStep] = useState(1); // 1 = Welcome, 2 = Logo Zoom, 3 = Move Logo, 4 = Cards

  useEffect(() => {
    setTimeout(() => setStep(2), 4000);   // پایان Welcome → Zoom-in Logo
    setTimeout(() => setStep(3), 6500);   // انتقال لوگو به بالا چپ
    setTimeout(() => setStep(4), 8200);   // نمایش کارت‌ها
  }, []);

  return (
    <div className="intro-master">
      
      {/* مرحله ۱ — متن خوش‌آمد */}
      {step === 1 && (
        <p className="intro-welcome fade-in">
          Everything you need, one community — IranConnect
        </p>
      )}

      {/* مرحله ۲ — لوگو Zoom-in - وسط صفحه */}
      {step === 2 && (
        <div className="intro-logo zoom-in">
          <img src="/IranConnect Dark.gif" alt="IranConnect Logo" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۳ — لوگو در حال انتقال به بالا چپ */}
      {step === 3 && (
        <div className="intro-logo move-top-left">
          <img src="/IranConnect Dark.gif" alt="IranConnect Logo" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۴ — لوگو ثابت بالا چپ */}
      {step === 4 && (
        <div className="intro-logo final-top-left">
          <img src="/IranConnect Dark.gif" alt="IranConnect Logo" />
          <h1>IRANCONNECT</h1>
        </div>
      )}

      {/* مرحله ۴ — کارت‌ها */}
      {step === 4 && <IntroCards />}
    </div>
  );
}
