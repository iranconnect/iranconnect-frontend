//frontend/components/ConsentReviewModal.jsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";import DOMPurify from "isomorphic-dompurify";

import apiClient from "../utils/apiClient";

const POLICY_TABS = [
  {
    key: "terms",
    labels: {
      en: "Terms of Service",
      fr: "Conditions d’utilisation",
      fa: "شرایط استفاده",
    },
  },
  {
    key: "privacy",
    labels: {
      en: "Privacy Policy",
      fr: "Politique de confidentialité",
      fa: "سیاست حفظ حریم خصوصی",
    },
  },
  {
    key: "cookies",
    labels: {
      en: "Cookie Policy",
      fr: "Politique des cookies",
      fa: "سیاست کوکی‌ها",
    },
  },
];

const TEXTS = {
  en: {
    title: "Review IranConnect policies",
    language: "Policy language",
    loading: "Loading policies...",
    error: "Unable to load policies. Please try again.",
    viewedAll: "Please open and review all three policies before confirming.",
    checkbox:
      "I have reviewed and accept the Terms of Service, Privacy Policy, and Cookie Policy.",
    confirm: "Confirm and continue",
    cancel: "Cancel",
    version: "Version",
  },
  fr: {
    title: "Consulter les politiques IranConnect",
    language: "Langue des politiques",
    loading: "Chargement des politiques...",
    error:
      "Impossible de charger les politiques. Veuillez réessayer.",
    viewedAll:
      "Veuillez ouvrir et consulter les trois politiques avant de confirmer.",
    checkbox:
      "J’ai consulté et j’accepte les conditions d’utilisation, la politique de confidentialité et la politique de cookies.",
    confirm: "Confirmer et continuer",
    cancel: "Annuler",
    version: "Version",
  },
  fa: {
    title: "بررسی سیاست‌های ایران‌کانکت",
    language: "زبان سیاست‌ها",
    loading: "در حال بارگذاری سیاست‌ها...",
    error:
      "بارگذاری سیاست‌ها ممکن نشد. لطفاً دوباره تلاش کنید.",
    viewedAll:
      "لطفاً پیش از تأیید، هر سه سیاست را باز و بررسی کنید.",
    checkbox:
      "شرایط استفاده، سیاست حفظ حریم خصوصی و سیاست کوکی‌ها را مطالعه کرده و می‌پذیرم.",
    confirm: "تأیید و ادامه",
    cancel: "انصراف",
    version: "نسخه",
  },
};

function getInitialLanguage(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return ["en", "fr", "fa"].includes(normalized)
    ? normalized
    : "en";
}

export default function ConsentReviewModal({
  initialLanguage = "en",
  onClose,
  onConfirmed,
}) {
  const [language, setLanguage] = useState(
    getInitialLanguage(initialLanguage)
  );

  const [bundle, setBundle] = useState(null);
  const [activeTab, setActiveTab] = useState("terms");
  const [viewedTabs, setViewedTabs] = useState(
    new Set(["terms"])
  );

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const policyContentRef = useRef(null);

  const text = TEXTS[language] || TEXTS.en;

  const allTabsViewed =
    viewedTabs.has("terms") &&
    viewedTabs.has("privacy") &&
    viewedTabs.has("cookies");

  useEffect(() => {
    let mounted = true;

    async function loadBundle() {
      setLoading(true);
      setError("");
      setAccepted(false);
      setActiveTab("terms");
      setViewedTabs(new Set(["terms"]));

      try {
        const response = await apiClient.get(
          "/policies/consent-bundle",
          {
            params: { lang: language },
            withCredentials: true,
          }
        );

        if (!mounted) {
          return;
        }

        setBundle(response.data);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setBundle(null);

        setError(
          err.response?.data?.error ||
            text.error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBundle();

    return () => {
      mounted = false;
    };
  }, [language]);

  useEffect(() => {
    policyContentRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [activeTab, language]);

  const activePolicy = bundle?.policies?.[activeTab] || null;

  const safePolicyHtml = useMemo(() => {
    if (!activePolicy?.content) {
      return "";
    }

    return DOMPurify.sanitize(
      activePolicy.content,
      {
        USE_PROFILES: {
          html: true,
        },

        ADD_ATTR: [
          "target",
          "rel",
          "class",
          "style",
        ],
      }
    );
  }, [activePolicy?.content]);

  function selectTab(nextTab) {
    setActiveTab(nextTab);

    setViewedTabs((current) => {
      const updated = new Set(current);
      updated.add(nextTab);
      return updated;
    });
  }

  function handleConfirm() {
    if (
      !accepted ||
      !allTabsViewed ||
      !bundle?.presentation_token
    ) {
      return;
    }

    onConfirmed({
      language: bundle.language,
      versions: bundle.versions,
      presentationToken:
        bundle.presentation_token,
      presentationExpiresAt:
        bundle.presentation_expires_at,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-review-title"
      style={{
        direction:
          language === "fa"
            ? "rtl"
            : "ltr",
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
        style={{
          borderColor: "var(--border)",
          background: "var(--card-bg)",
          color: "var(--text)",
        }}
      >
        <div className="border-b px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="consent-review-title"
                className="text-xl font-semibold"
              >
                {text.title}
              </h2>

              <p className="mt-1 text-sm opacity-70">
                {text.language}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1 text-sm opacity-70 transition hover:opacity-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["en", "fr", "fa"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  language === item
                    ? "border-turquoise bg-turquoise text-navy"
                    : "border-[var(--border)]"
                }`}
              >
                {item === "en"
                  ? "English"
                  : item === "fr"
                  ? "Français"
                  : "فارسی"}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b px-6 pt-4">
          <div className="flex flex-wrap gap-2">
            {POLICY_TABS.map((tab) => {
              const isActive =
                activeTab === tab.key;

              const isViewed =
                viewedTabs.has(tab.key);

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => selectTab(tab.key)}
                  className={`rounded-t-lg border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-b-[var(--card-bg)] bg-[var(--card-bg)]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {tab.labels[language] || tab.labels.en}
                  {isViewed ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={policyContentRef}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        >
          {loading && (
            <p className="text-sm opacity-70">
              {text.loading}
            </p>
          )}

          {!loading && error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && !error && activePolicy && (
            <>
              <div className="mb-4 flex flex-wrap gap-3 text-xs opacity-70">
                <span>
                  {text.version}:{" "}
                  <strong>
                    {activePolicy.version}
                  </strong>
                </span>

                <span>
                  {new Date(
                    activePolicy.createdAt
                  ).toLocaleDateString(
                    language === "fa"
                      ? "fa-IR"
                      : language === "fr"
                      ? "fr-FR"
                      : "en-GB"
                  )}
                </span>
              </div>

              <article
                className="consent-policy-content prose max-w-none prose-sm"
                dir={
                  language === "fa"
                    ? "rtl"
                    : "ltr"
                }
                dangerouslySetInnerHTML={{
                  __html: safePolicyHtml,
                }}
              />
            </>
          )}
        </div>

        <div className="border-t px-6 py-5">
          {!allTabsViewed && (
            <p className="mb-3 text-sm text-amber-700">
              {text.viewedAll}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={accepted}
              disabled={
                loading ||
                !!error ||
                !allTabsViewed
              }
              onChange={(event) =>
                setAccepted(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 accent-turquoise"
            />

            <span>{text.checkbox}</span>
          </label>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary px-4 py-2 text-sm"
            >
              {text.cancel}
            </button>

            <button
              type="button"
              disabled={
                loading ||
                !!error ||
                !allTabsViewed ||
                !accepted
              }
              onClick={handleConfirm}
              className="admin-btn admin-btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {text.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
