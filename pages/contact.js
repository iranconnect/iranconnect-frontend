//pages/contact.js
'use client';
import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import apiClient from '../utils/apiClient';
import ReCAPTCHA from 'react-google-recaptcha';

export default function ContactPage() {
  // 🧱 حالت اولیه فرم
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjectType: '',
    customSubject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  // PLR05-S01: Server-authoritative Contact cooldown.
  const [cooldownStatus, setCooldownStatus] = useState('checking');
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const refreshCooldown = useCallback(async () => {
    setCooldownStatus('checking');
    try {
      const response = await apiClient.get('/contact/cooldown-status');
      const data = response.data;

      if (data?.success !== true ||
          typeof data.cooldown_active !== 'boolean') {
        throw new Error('Invalid cooldown status response');
      }

      if (data.cooldown_active) {
        const until = Date.parse(data.cooldown_until);
        if (!Number.isFinite(until)) {
          throw new Error('Invalid cooldown expiration');
        }
        setCooldownUntil(until);
      } else {
        setCooldownUntil(null);
      }

      setCurrentTime(Date.now());
      setCooldownStatus('ready');
    } catch {
      setCooldownUntil(null);
      setCooldownStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    refreshCooldown();
  }, [refreshCooldown]);

  useEffect(() => {
    if (cooldownUntil === null) return undefined;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownStatus === 'ready' &&
        cooldownUntil !== null &&
        currentTime >= cooldownUntil) {
      refreshCooldown();
    }
  }, [cooldownStatus, cooldownUntil, currentTime, refreshCooldown]);

  const remainingSeconds = cooldownUntil === null
    ? 0
    : Math.max(0, Math.ceil((cooldownUntil - currentTime) / 1000));

  const cooldownActive = cooldownUntil !== null;
  const submissionBlocked =
    loading || cooldownStatus !== 'ready' || cooldownActive;

  const formatRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };


  // برای reset کردن reCAPTCHA
  const recaptchaRef = useRef();

  // 🎨 کنترل تم (dark/light)
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // 🔍 اعتبارسنجی ایمیل
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 🎯 تغییرات فرم
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));

    if (e.target.name === 'email' && e.target.value) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(e.target.value) ? '' : 'Invalid email format',
      }));
    }
  };

  // ✉️ ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionBlocked) return;
    setSuccess('');
    setErrors({});
    setLoading(true);

    const { name, email, subjectType, customSubject, message } = formData;
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Required';
    if (!email.trim() || !validateEmail(email)) newErrors.email = 'Invalid email';
    if (!subjectType) newErrors.subjectType = 'Please select a subject';
    if (subjectType === 'other' && !customSubject.trim()) newErrors.customSubject = 'Please enter subject';
    if (!message.trim()) newErrors.message = 'Required';
    if (!captchaToken) newErrors.captcha = 'Please verify reCAPTCHA';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.post(
        '/contact',
        {
          name,
          email,
          subjectType,
          customSubject,
          message,
          recaptchaToken: captchaToken,
        },
        {
          headers: { "x-iranconnect-contact": "1" }
        }
      );


      if (res.data?.success) {
        setSuccess(res.data.message || '✅ Your message was sent successfully!');
        await refreshCooldown();
      } else {
        setErrors({ global: res.data?.error || '⚠️ Something went wrong.' });
      }

      // پاک کردن فرم و ریست کپچا
      setFormData({
        name: '',
        email: '',
        subjectType: '',
        customSubject: '',
        message: '',
      });
      setCaptchaToken(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error('❌ Contact submit error:', err);
      }
      const data = err.response?.data;

      if (err.response?.status === 429 &&
          data?.code === 'CONTACT_COOLDOWN_ACTIVE') {
        const until = Date.parse(data.cooldown_until);
        if (Number.isFinite(until)) {
          setCooldownUntil(until);
          setCurrentTime(Date.now());
          setCooldownStatus('ready');
        } else {
          await refreshCooldown();
        }
        setErrors({});
      } else {
        const msg = data?.error ||
          'Server error. Please try again later.';
        setErrors({ global: msg });
      }
    } finally {
      setLoading(false);
    }
  };
  /* ───────────── 🧩 رابط کاربری ───────────── */
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
                ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
                : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">📩 Contact Us</h2>

          {/* پیام‌های وضعیت */}
          {errors.global && <p className="text-red-500 text-sm mb-3">{errors.global}</p>}
          {success && <p className="text-green-500 text-sm mb-3">{success}</p>}

          {cooldownStatus === 'checking' && (
            <p role="status" className="text-sm mb-3">
              Checking contact availability...
            </p>
          )}
          {cooldownStatus === 'unavailable' && (
            <div role="alert" className="text-sm mb-3">
              <p>Contact availability is temporarily unavailable.</p>
              <button
                type="button"
                onClick={refreshCooldown}
                className="underline mt-1"
              >
                Check again
              </button>
            </div>
          )}
          {cooldownActive && (
            <p role="status" className="text-sm mb-3">
              Contact submissions are temporarily limited.
              You can try again in {formatRemaining(remainingSeconds)}.
            </p>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              className="input-default w-full"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}

            <input
              type="email"
              name="email"
              placeholder="Your email"
              value={formData.email}
              onChange={handleChange}
              className={`input-default w-full ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

            {/* 🔽 Subject Dropdown */}
            <select
              name="subjectType"
              value={formData.subjectType}
              onChange={handleChange}
              className="input-default w-full"
            >
              <option value="">-- Select a subject --</option>
              <option value="unblock_request">Request Account Unblock</option>
              <option value="business_ownership_dispute">Business Ownership Dispute</option>
              <option value="account_access_issue">Account Access Issue</option>
              <option value="business_request_issue">Business Request Issue</option>
              <option value="other">Other</option>
            </select>
            {errors.subjectType && <p className="text-red-500 text-xs">{errors.subjectType}</p>}

            {/* 📝 Custom Subject Field */}
            {formData.subjectType === 'other' && (
              <>
                <input
                  type="text"
                  name="customSubject"
                  placeholder="Enter subject"
                  value={formData.customSubject}
                  onChange={handleChange}
                  className="input-default w-full"
                />
                {errors.customSubject && <p className="text-red-500 text-xs">{errors.customSubject}</p>}
              </>
            )}

            <textarea
              name="message"
              placeholder="Your message"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className="input-default w-full"
            />
            {errors.message && <p className="text-red-500 text-xs">{errors.message}</p>}

            {/* 🔐 Google reCAPTCHA */}
            <div className="flex justify-center my-3">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
            {errors.captcha && <p className="text-red-500 text-xs text-center">{errors.captcha}</p>}

            <button type="submit" disabled={submissionBlocked} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
