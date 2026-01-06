//pages/business/[slug].js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RatingStars from "../../components/RatingStars";
import ClaimBusinessWidget from "../../components/ClaimBusinessWidget";

import { X } from "lucide-react";
import { getCountryCallingCode } from "libphonenumber-js";
import apiClient from "../../utils/apiClient";

/* ======================================================
   SSR — Fetch business by slug
====================================================== */
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      "https://api.iranconnect.org";

    const res = await fetch(
      `${apiBase}/businesses/by-slug/${encodeURIComponent(slug)}`
    );

    if (!res.ok) {
      return { notFound: true };
    }

    const biz = await res.json();

    return {
      props: {
        biz,
        isStaging,
      },
    };
  } catch {
    return { notFound: true };
  }
}

/* ======================================================
   Page
====================================================== */
export default function BusinessBySlug({ biz, isStaging }) {
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  /* ===============================
     🌗 Theme watcher (UNCHANGED)
  =============================== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      const next =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(next);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ===============================
     🔐 Auth + role detection
  =============================== */
  useEffect(() => {
    let mounted = true;

    apiClient
      .get("/auth/me", { silent: true })
      .then((res) => {
        if (!mounted) return;

        setIsLoggedIn(true);
        if (
          res.data?.role === "admin" ||
          res.data?.role === "superadmin"
        ) {
          setIsAdminView(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoggedIn(false);
        setIsAdminView(false);
      })
      .finally(() => mounted && setAuthChecked(true));

    return () => {
      mounted = false;
    };
  }, []);

  /* ===============================
     ⭐ Submit rating (UNCHANGED)
  =============================== */
  async function submitRating() {
    try {
      if (!isLoggedIn) {
        setMessage("You must be logged in to rate.");
        return;
      }

      await apiClient.post(
        `/businesses/${biz.id}/ratings`,
        { score: rating }
      );

      setMessage("✅ Rating submitted");
    } catch (e) {
      setMessage(
        e.response?.data?.error || "Error submitting rating."
      );
    }
  }

  /* ===============================
     🖼 Images (UNCHANGED)
  =============================== */
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_BASE || "http://localhost:5000";

  const original = biz.logo_url
    ? biz.logo_url.startsWith("http")
      ? biz.logo_url
      : `${apiBase.replace("/api", "")}${biz.logo_url}`
    : "/logo.png";

  let imageSrc = original;
  if (original.startsWith("http")) {
    const filename = original.split("/").pop().split("?")[0];
    imageSrc = `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(
      original
    )}`;
  }

  const phoneWithCode =
    biz?.phone && biz?.country
      ? `+${getCountryCallingCode(biz.country)} ${biz.phone}`
      : biz?.phone || "";

  const obfuscatedEmail = biz?.email
    ? biz.email.replace("@", " [at] ")
    : null;

  /* ===============================
     🧱 Render
  =============================== */
  if (!biz || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* ===============================
          🧠 SEO Head
      =============================== */}
      <Head>
        <title>{biz.name} | IranConnect</title>
      
        <meta
          name="description"
          content={
            biz.short_description ||
            biz.full_description?.slice(0, 160)
          }
        />
      
        <link
          rel="canonical"
          href={`https://iranconnect.org/business/${biz.slug}`}
        />
      
        <meta property="og:title" content={biz.name} />
        <meta
          property="og:description"
          content={
            biz.short_description ||
            biz.full_description?.slice(0, 160)
          }
        />
        <meta
          property="og:image"
          content={biz.cover_image_url || biz.logo_url}
        />
        <meta property="og:type" content="business.business" />
      
        {/* 🔵 Structured Data — LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `https://iranconnect.org/business/${biz.slug}`,
              name: biz.name,
              url: `https://iranconnect.org/business/${biz.slug}`,
              logo: biz.logo_url || undefined,
              image: biz.cover_image_url || biz.logo_url || undefined,
              address: {
                "@type": "PostalAddress",
                streetAddress: biz.address || undefined,
                addressLocality: biz.city || undefined,
                addressCountry: biz.country || undefined,
                postalCode: biz.postal_code || undefined,
              },
              telephone: biz.phone || undefined,
              aggregateRating: biz.avg_rating
                ? {
                    "@type": "AggregateRating",
                    ratingValue: biz.avg_rating,
                    reviewCount: biz.review_count || 1,
                  }
                : undefined,
            }),
          }}
        />
      </Head>


        {/* ===============================
            UI — UNCHANGED
        =============================== */}
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="rounded-2xl p-8 w-full max-w-2xl border">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <img
                src={imageSrc}
                alt={biz.name}
                className="w-44 h-44 rounded-xl object-cover cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />

              <div className="flex-1 space-y-3">
                <h1 className="text-2xl font-semibold">
                  {biz.name}
                  {biz.owner_verified && <span> 🎖️</span>}
                </h1>

                <p className="text-sm opacity-80">
                  {biz.category} • {biz.city}
                </p>

                {biz.address && <p>📍 {biz.address}</p>}

                {isLoggedIn && (
                  <>
                    {phoneWithCode && <p>📞 {phoneWithCode}</p>}
                    {obfuscatedEmail && (
                      <p>📧 {obfuscatedEmail}</p>
                    )}
                    {biz.website && (
                      <p>
                        🌐{" "}
                        <a
                          href={biz.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit Website
                        </a>
                      </p>
                    )}
                  </>
                )}

                <p className="text-lg font-medium">
                  ⭐ {biz.avg_rating ?? "—"}
                </p>
              </div>
            </div>

            {/* Rating */}
            {!isAdminView && isLoggedIn && (
              <div className="mt-8 border-t pt-6">
                <RatingStars
                  value={rating}
                  onChange={setRating}
                />
                <button
                  disabled={!rating}
                  onClick={submitRating}
                >
                  Submit
                </button>
                {message && <p>{message}</p>}
              </div>
            )}

            {/* Claim */}
            {!isAdminView && (
              <div className="mt-10 border-t pt-6 text-center">
                {biz.owner_verified ? (
                  <p>🎖️ Verified by owner</p>
                ) : isLoggedIn ? (
                  <ClaimBusinessWidget
                    businessId={biz.id}
                  />
                ) : null}
              </div>
            )}
          </div>
        </main>

        <Footer />

        {/* Image modal */}
        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center"
            onClick={() => setShowImageModal(false)}
          >
            <img
              src={imageSrc}
              alt={biz.name}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </>
  );
}
