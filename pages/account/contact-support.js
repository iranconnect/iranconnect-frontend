import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";
import ReCAPTCHA from "react-google-recaptcha";

const SUBJECTS = [
  {
    value: "business_ownership_dispute",
    label: "Business Ownership Dispute",
  },
  {
    value: "account_access_issue",
    label: "Account Access Issue",
  },
  {
    value: "business_request_issue",
    label: "Business Request Issue",
  },
];

export default function AccountContactSupport() {
  const [subjectType, setSubjectType] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cooldownStatus, setCooldownStatus] = useState("checking");
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const captchaRef = useRef(null);

  const refreshCooldown = useCallback(async () => {
    setCooldownStatus("checking");

    try {
      const response = await apiClient.get(
        "/contact/cooldown-status",
        { withCredentials: true }
      );

      if (
        response.data?.success !== true ||
        typeof response.data.cooldown_active !== "boolean"
      ) {
        throw new Error("Invalid cooldown response");
      }

      const until = response.data.cooldown_active
        ? Date.parse(response.data.cooldown_until)
        : null;

      if (until !== null && !Number.isFinite(until)) {
        throw new Error("Invalid cooldown expiration");
      }

      setCooldownUntil(until);
      setNow(Date.now());
      setCooldownStatus("ready");
    } catch {
      setCooldownUntil(null);
      setCooldownStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    refreshCooldown();
  }, [refreshCooldown]);

  useEffect(() => {
    if (cooldownUntil === null) return undefined;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (
      cooldownStatus === "ready" &&
      cooldownUntil !== null &&
      now >= cooldownUntil
    ) {
      refreshCooldown();
    }
  }, [cooldownStatus, cooldownUntil, now, refreshCooldown]);

  const remainingSeconds = cooldownUntil === null
    ? 0
    : Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const cooldownActive = cooldownUntil !== null;
  const submissionBlocked =
    loading || cooldownStatus !== "ready" || cooldownActive;

  const formatRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionBlocked) return;

    setError("");
    setSuccess("");

    if (!SUBJECTS.some((subject) => subject.value === subjectType)) {
      setError("Please select a valid subject.");
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage || trimmedMessage.length > 3000) {
      setError("Please enter a message of up to 3000 characters.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete reCAPTCHA verification.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post(
        "/contact/authenticated",
        {
          subjectType,
          message: trimmedMessage,
          recaptchaToken: captchaToken,
        },
        {
          withCredentials: true,
          headers: {
            "x-iranconnect-contact": "1",
          },
        }
      );

      if (
        response.status !== 201 ||
        response.data?.success !== true
      ) {
        throw new Error("Unexpected support response");
      }

      setSuccess("Your support request has been submitted.");
      setSubjectType("");
      setMessage("");
      await refreshCooldown();
    } catch (err) {
      const data = err.response?.data;

      if (
        err.response?.status === 429 &&
        data?.code === "CONTACT_COOLDOWN_ACTIVE"
      ) {
        const until = Date.parse(data.cooldown_until);

        if (Number.isFinite(until)) {
          setCooldownUntil(until);
          setNow(Date.now());
          setCooldownStatus("ready");
        } else {
          await refreshCooldown();
        }

        setError("Contact submissions are temporarily limited.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 403 ||
                 err.response?.status === 423) {
        setError("This request cannot be submitted.");
      } else if (err.response?.status === 503) {
        setError("Support is temporarily unavailable. Please try again later.");
      } else {
        setError("Unable to submit your request. Please check your details.");
      }
    } finally {
      setCaptchaToken(null);
      captchaRef.current?.reset();
      setLoading(false);
    }
  }

  return (
    <AccountLayout>
      <Head>
        <title>Contact Support | IranConnect</title>
      </Head>

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/account/requests"
            className="text-sm text-turquoise hover:underline"
          >
            Back to Requests / History
          </Link>
        </div>

        <section className="rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-semibold mb-3">
            Contact Support
          </h1>

          <p className="text-sm mb-6">
            Submit a support request associated with your account.
          </p>

          {error && (
            <p role="alert" className="text-red-500 mb-4">
              {error}
            </p>
          )}

          {success && (
            <div role="status" className="mb-4">
              <p className="text-green-600">{success}</p>
              <Link
                href="/account/requests"
                className="text-turquoise underline"
              >
                View Requests / History
              </Link>
            </div>
          )}

          {cooldownStatus === "checking" && (
            <p role="status" className="mb-4">
              Checking contact availability...
            </p>
          )}

          {cooldownStatus === "unavailable" && (
            <div role="alert" className="mb-4">
              <p>Contact availability is temporarily unavailable.</p>
              <button
                type="button"
                onClick={refreshCooldown}
                className="underline"
              >
                Check again
              </button>
            </div>
          )}

          {cooldownActive && (
            <p role="status" className="mb-4">
              Contact submissions are temporarily limited.
              Try again in {formatRemaining(remainingSeconds)}.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="contact-subject" className="block mb-2">
                Subject
              </label>
              <select
                id="contact-subject"
                value={subjectType}
                onChange={(event) => setSubjectType(event.target.value)}
                className="input-default w-full"
                required
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className="block mb-2">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={6}
                maxLength={3000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="input-default w-full"
                required
              />
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={setCaptchaToken}
              />
            </div>

            <button
              type="submit"
              disabled={submissionBlocked}
              className="btn-primary w-full"
            >
              {loading ? "Submitting..." : "Submit Support Request"}
            </button>
          </form>
        </section>
      </main>
    </AccountLayout>
  );
}
