//pages/business/[slug].js
import Head from "next/head";
import { useState } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RatingStars from "../../components/RatingStars";
import ClaimBusinessWidget from "../../components/ClaimBusinessWidget";
import BusinessHero from "../../components/business/BusinessHero";

import { X } from "lucide-react";
import { getCountryCallingCode } from "libphonenumber-js";

import apiClient from "../../utils/apiClient";
import { useAuthSession } from "../../hooks/useAuthSession";

/* ======================================================
   SSR — Fetch business by slug
====================================================== */
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE || "https://api.iranconnect.org";

    const cookie = context.req.headers.cookie || "";

    const res = await fetch(
      `${apiBase}/businesses/by-slug/${encodeURIComponent(slug)}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          ...(cookie ? { cookie } : {}),
        },
      }
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
   Helpers
====================================================== */
function toPlainText(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildMetaDescription(biz) {
  const shortText = toPlainText(biz?.short_description);
  const fullText = toPlainText(biz?.full_description);

  const base = shortText || fullText || `${biz?.name || "Business"} on IranConnect`;
  return base.slice(0, 160);
}

/* ======================================================
   Page
====================================================== */
export default function BusinessBySlug({ biz }) {
  const { status, role } = useAuthSession();

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);

  const isAuthReady = status !== "checking";
  const isLoggedIn = status === "authenticated";
  const isAdminView = role === "admin" || role === "superadmin";

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
    imageSrc = `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(original)}`;
  }

  const coverImage = biz.cover_image_url || biz.logo_url || null;

  let phoneWithCode = biz?.phone || "";

  try {
    if (biz?.phone && biz?.country && /^[A-Z]{2}$/.test(biz.country)) {
      phoneWithCode = `+${getCountryCallingCode(biz.country)} ${biz.phone}`;
    }
  } catch {
    phoneWithCode = biz?.phone || "";
  }

  const metaDescription = buildMetaDescription(biz);
  const canonicalUrl = `https://iranconnect.org/business/${biz.slug}`;
  const shouldNoIndex = isAdminView && biz?.is_public === false;

  async function submitRating() {
    try {
      if (!isLoggedIn) {
        setMessage("You must be logged in to rate.");
        return;
      }

      if (!biz.allow_reviews) {
        setMessage("Reviews are disabled for this business.");
        return;
      }

      await apiClient.post(`/businesses/${biz.id}/ratings`, {
        score: rating,
      });

      setMessage("✅ Rating submitted");
    } catch (e) {
      setMessage(e.response?.data?.error || "Error submitting rating.");
    }
  }

  if (!biz || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{biz.name} | IranConnect</title>

        <meta name="description" content={metaDescription} />

        <link rel="canonical" href={canonicalUrl} />

        {shouldNoIndex && (
          <meta name="robots" content="noindex,nofollow" />
        )}

        <meta property="og:title" content={biz.name} />
        <meta property="og:description" content={metaDescription} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={canonicalUrl} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": canonicalUrl,
              name: biz.name,
              url: canonicalUrl,
              logo: biz.logo_url || undefined,
              image: coverImage || undefined,
              description: metaDescription || undefined,
              address: {
                "@type": "PostalAddress",
                streetAddress: biz.address || undefined,
                addressLocality: biz.city || undefined,
                addressCountry: biz.country || undefined,
                postalCode: biz.postal_code || undefined,
              },
              telephone: biz.phone || undefined,
              sameAs: [
                biz.website,
                biz.instagram_url,
                biz.facebook_url,
                biz.linkedin_url,
                biz.twitter_url,
                biz.telegram_url,
              ].filter(Boolean),
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

      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-5xl space-y-8">
            {isAdminView && biz?.is_public === false && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
                Admin preview: this business is currently private/unpublished and is visible here because you are logged in as an admin.
              </div>
            )}

            <BusinessHero biz={biz} phoneWithCode={phoneWithCode} />

            {biz.full_description && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold mb-3">About this business</h2>
                <p className="whitespace-pre-line">{toPlainText(biz.full_description)}</p>
              </div>
            )}

            {(biz.service_mode ||
              biz.availability_type ||
              biz.availability_note ||
              biz.service_radius_km) && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold mb-3">Service details</h2>
                <div className="grid gap-2 text-sm">
                  {biz.service_mode && (
                    <p>
                      <strong>Service mode:</strong> {biz.service_mode}
                    </p>
                  )}
                  {biz.availability_type && (
                    <p>
                      <strong>Availability type:</strong> {biz.availability_type}
                    </p>
                  )}
                  {biz.availability_note && (
                    <p>
                      <strong>Availability note:</strong> {biz.availability_note}
                    </p>
                  )}
                  {biz.service_radius_km && (
                    <p>
                      <strong>Service radius:</strong> {biz.service_radius_km} km
                    </p>
                  )}
                </div>
              </div>
            )}

            {(biz.instagram_url ||
              biz.facebook_url ||
              biz.linkedin_url ||
              biz.twitter_url ||
              biz.telegram_url ||
              biz.whatsapp_number) && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold mb-3">Online presence</h2>
                <div className="grid gap-2 text-sm">
                  {biz.instagram_url && (
                    <p>
                      <strong>Instagram:</strong>{" "}
                      <a href={biz.instagram_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </p>
                  )}
                  {biz.facebook_url && (
                    <p>
                      <strong>Facebook:</strong>{" "}
                      <a href={biz.facebook_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </p>
                  )}
                  {biz.linkedin_url && (
                    <p>
                      <strong>LinkedIn:</strong>{" "}
                      <a href={biz.linkedin_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </p>
                  )}
                  {biz.twitter_url && (
                    <p>
                      <strong>X / Twitter:</strong>{" "}
                      <a href={biz.twitter_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </p>
                  )}
                  {biz.telegram_url && (
                    <p>
                      <strong>Telegram:</strong>{" "}
                      <a href={biz.telegram_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </p>
                  )}
                  {biz.whatsapp_number && (
                    <p>
                      <strong>WhatsApp:</strong> {biz.whatsapp_number}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isAdminView && isLoggedIn && biz.allow_reviews && (
              <div className="mt-8 border-t pt-6">
                <RatingStars value={rating} onChange={setRating} />
                <button disabled={!rating} onClick={submitRating}>
                  Submit
                </button>
                {message && <p>{message}</p>}
              </div>
            )}

            {!isAdminView && (
              <div className="mt-10 border-t pt-6 text-center">
                {biz.owner_verified ? (
                  <p>🎖️ Verified by owner</p>
                ) : isLoggedIn ? (
                  <ClaimBusinessWidget businessId={biz.id} />
                ) : null}
              </div>
            )}
          </div>
        </main>

        <Footer />

        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              type="button"
              aria-label="Close image"
              className="absolute top-4 right-4 text-white"
              onClick={() => setShowImageModal(false)}
            >
              <X size={28} />
            </button>

            <img
              src={imageSrc}
              alt={biz.name}
              loading="lazy"
              decoding="async"
              className="max-h-[90vh] max-w-[90vw] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </>
  );
}
