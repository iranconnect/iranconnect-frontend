//frontend/pages/intro.js
import { useEffect, useState } from "react";
import IntroCards from "../components/IntroCards";
import Footer from "../components/Footer";  // اضافه کردن فوتر

export default function Intro() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 4000), // پیام خوش‌آمد طولانی‌تر
      setTimeout(() => setStep(3), 6500), // نمایش لوگو از opacity 0→1
      setTimeout(() => setStep(4), 8000), // نمایش جدول دکمه‌ها
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="intro-master">
      
      {/* مرحله Welcome */}
      {step === 1 && (
        <p className="intro-welcome fade-in-out">
          Everything you need, one community — IranConnect
        </p>
      )}

      {/* مرحله لوگو + جدول */}
      {step >= 3 && (
        <IntroCards showLogo={true} showButtons={step === 4} />
      )}

      {/* اضافه کردن فوتر به صفحه Intro */}
      <Footer />
    </div>
  );
}
