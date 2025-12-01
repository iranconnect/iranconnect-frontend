// frontend/pages/intro.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";  // برای استفاده از router.push
import IntroCards from "../components/IntroCards"; // کامپوننت دکمه‌ها
import Footer from "../components/Footer"; // فوتر

export default function Intro() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // استفاده از useEffect برای تایمرهای مربوط به اینترو
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 4000), // پیام خوش‌آمد طولانی‌تر
      setTimeout(() => setStep(3), 6500), // نمایش لوگو از opacity 0→1
      setTimeout(() => setStep(4), 8000), // نمایش جدول دکمه‌ها
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // مدیریت کلیک روی دکمه‌ها برای هدایت به صفحه هوم یا About Us
  const handleButtonClick = (title) => {
    if (title !== "About Us") {
      router.push("/index?theme=dark");  // ریدایرکت به صفحه هوم
    } else {
      router.push("/about?theme=dark");  // ریدایرکت به صفحه "About Us"
    }
  };

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
        <IntroCards showLogo={true} showButtons={step === 4} onButtonClick={handleButtonClick} />
      )}

      {/* فوتر ایران‌کانکت - فقط بعد از نمایش لوگو */}
      {step >= 3 && <Footer />}
    </div>
  );
}
