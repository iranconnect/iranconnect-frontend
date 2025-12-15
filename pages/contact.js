// pages/contact.js
"use client";

import { useState, useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import apiClient from "../utils/apiClient";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactPage() {
  /* ───────────── State ───────────── */
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subjectType: "",
    customSubject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const recaptchaRef = useRef(null);
  const submittingRef = useRef(false); // 🔐 anti double-submit

  /* 🎨 Theme watcher */
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* 🔍 Email validation */
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* 🧼 Sanitize + limit input */
  const sanitize = (value, max) =>
    DOMPurify.sanitize(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);

  /* 🎯 Input change */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email" && value) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value) ? "" : "Invalid email format",
      }));
    }
  };

  /* ✉️ Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;

    setErrors({});
    setSuccess("");
    setLoading(true);
    submittingRef.current = true;

    const newErrors = {};
    const name = sanitize(formData.name, 100);
    const email = sanitize(formData.email, 150);
    const subjectType = formData.subjectType;
    const customSubject = sanitize(formData.customSubject, 150);
    const message = sanitize(formData.message, 2000);

    if (!name) newErrors.name = "Required";
    if (!email || !validateEmail(email)) newErrors.email = "Invalid email";
    if (!subjectType) newErrors.subjectType = "Please select a subject";
    if (subjectType === "other" && !customSubject)
      newErrors.customSubject = "Please enter subject";
    if (!message) newErrors.message = "Required";
    if (!captchaToken) newErrors.captcha = "Please verify reCAPTCHA";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    try {
      const res = await apiClient.post(
        "/contact",
        {
          name,
          email,
          subjectType,
          customSubject,
          message,
          recaptchaToken: captchaToken,
        },
        {
          headers: {
            "x-iranconnect-contact": "1",
          },
        }
      );

      if (res.data?.success) {
        setSuccess(
          res.data.message || "✅ Your message was sent successfully!"
        );
        setFormData({
          name: "",
          email: "",
          subjectType: "",
          customSubject: "",
          message: "",
        });
      } else {
        setErrors({
          global: res.data?.error || "⚠️ Something went wrong.",
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Server error. Please try again later.";
      setErrors({ global: msg });
    } finally {
      setLoading(false);
      submittingRef.current = false;
      setCaptchaToken(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    }
  };

  /* ───────────── UI ───────────── */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#ffffff",
        color: "var(--text)",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          className="rounded-2xl p-8 w-full max-w-md border transition-all duration-300"
          style={{
            background: theme === "dark" ? "#0b2149" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#0a1b2a",
            borderColor:
              theme === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            boxShadow:
              theme === "dark"
                ? "10px 10px 25px rgba(0,0,0,0.4)"
                : "6px 6px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">
            📩 Contact Us
          </h2>

          {errors.global && (
            <p className="text-red-500 text-sm mb-3">{errors.global}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm mb-3">{success}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* inputs unchanged visually */}
            {/* ... (همان JSX قبلی بدون تغییر UI) */}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
