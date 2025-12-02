// frontend/pages/intro.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import IntroCards from "../components/IntroCards";
import Footer from "../components/Footer";

export default function Intro() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  /* 🔥 dynamic viewport height برای رفع مشکل فوتر موبایل */
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };

    setVh();
    window.addEventListener("resize", setVh);

    return () => window.removeEventListener("resize", setVh);
  }, []);

  /* انیمیشن اینترو */
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(2), 4000),
      setTimeout(() => setStep(3), 6500),
      setTimeout(() => setStep(4), 8000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  /* کلیک روی کارت‌ها */
  const handleButtonClick = (title) => {
    localStorage.setItem("hasVisitedIntro", "true");

    if (title !== "About Us") {
      router.push("/search?theme=dark");
    } else {
      router.push("/about?theme=dark");
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

      {/* مرحله لوگو + دکمه‌ها */}
      {step >= 3 && (
        <IntroCards
          showLogo={true}
          showButtons={step === 4}
          onButtonClick={handleButtonClick}
        />
      )}

      {/* فوتر */}
      {step >= 3 && (
        <>
          <div className="intro-bottom-space"></div>
          <Footer />
        </>
      )}
    </div>
  );
}
