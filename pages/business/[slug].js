//pages/business/[slug].js 
import Head from "next/head";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RatingStars from "../../components/RatingStars";
import BusinessHero from "../../components/business/BusinessHero";
import BusinessAbout from "../../components/business/BusinessAbout";
import BusinessServices from "../../components/business/BusinessServices";   
import BusinessLocation from "../../components/business/BusinessLocation";
import BusinessGallery from "../../components/business/BusinessGallery";
import BusinessReviews from "../../components/business/BusinessReviews";
import BlurGate from "../../components/ui/BlurGate";
import BusinessClaim from "../../components/business/BusinessClaim";
import BusinessContact from "../../components/business/BusinessContact";
import BusinessStickyCTA from "../../components/business/BusinessStickyCTA";
import BusinessServicesList from "../../components/business/BusinessServicesList";
import BusinessTags from "../../components/business/BusinessTags";
import BusinessSubcategories from "../../components/business/BusinessSubcategories";

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

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || "https://api.iranconnect.org";

  const cookie = context.req.headers.cookie || "";

  // 🔥 STEP 1: اگر ID بود → redirect
  if (/^\d+$/.test(slug)) {
    try {
      const res = await fetch(`${apiBase}/businesses/${slug}`);

      if (!res.ok) return { notFound: true };

      const data = await res.json();

      if (data?.slug) {
        return {
          redirect: {
            destination: `/business/${data.slug}`,
            permanent: true,
          },
        };
      }

      return { notFound: true };
    } catch {
      return { notFound: true };
    }
  }

  // ✅ STEP 2: slug واقعی
  try {
    const res = await fetch(
      `${apiBase}/public-businesses/by-slug/${encodeURIComponent(slug)}`,
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
  const [showScrollTop, setShowScrollTop] = useState(false); 
  const [showCTA, setShowCTA] = useState(true); 

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
  const isStaging = process.env.NEXT_PUBLIC_ENV !== "production";

  const shouldNoIndex =
    isStaging || (isAdminView && biz?.is_public === false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 300);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // اگر footer دیده شد → CTA مخفی
        setShowCTA(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    observer.observe(footer);

    return () => observer.disconnect();
  }, []); 
   
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

      await apiClient.post(`/businesses/${biz.id}/reviews`, {
        rating,
      });

      setMessage("✅ Rating submitted");
      
      setTimeout(() => {
        window.location.reload();
      }, 800); 
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
        <title>
          {biz.name} in {biz.city} | {biz.category} | IranConnect
        </title>

        <meta
          name="description"
          content={`${biz.name} - ${biz.category} in ${biz.city}. ${metaDescription}`}
        />

        <link rel="canonical" href={canonicalUrl} />

        <meta
          name="robots"
          content={shouldNoIndex ? "noindex,nofollow" : "index,follow"}
        />   

        <meta property="og:title" content={biz.name} />
        <meta property="og:description" content={metaDescription} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="IranConnect" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />

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
              aggregateRating:
                biz.avg_rating && biz.review_count > 0
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: Number(biz.avg_rating),
                      reviewCount: Number(biz.review_count),
                      bestRating: 5,
                      worstRating: 1,
                    }
                  : undefined,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://iranconnect.org",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: biz.category || "Category",
                  item: `https://iranconnect.org/search?category=${encodeURIComponent(
                    biz.category || ""
                  )}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: biz.name,
                  item: canonicalUrl,
                },
              ],
            }),
          }}
        /> 
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />

        <main
           className="flex-1 flex items-center justify-center px-4 py-4 md:pb-4"
           style={{
             backgroundColor: "#ffffff",
             paddingBottom: "calc(40px + env(safe-area-inset-bottom))",
           }}
         >
          <div className="w-full max-w-5xl space-y-8">
            {isAdminView && biz?.is_public === false && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
                Admin preview: this business is currently private/unpublished and is visible here because you are logged in as an admin.
              </div>
            )}

            <BusinessHero
              biz={biz}
              phoneWithCode={phoneWithCode}
              isLoggedIn={isLoggedIn}
            />

            <BusinessAbout biz={biz} />

            <BusinessSubcategories subcategories={biz.subcategories} />
            <BusinessServicesList services={biz.services} />
            <BusinessTags tags={biz.tags} />     

            <BlurGate isVisible={isLoggedIn}>
              <BusinessGallery biz={biz} />
            </BlurGate>

            <BlurGate isVisible={isLoggedIn}>
              <BusinessReviews businessId={biz.id} />
            </BlurGate>

            <BlurGate isVisible={isLoggedIn}>
              <BusinessServices biz={biz} />
            </BlurGate>

            <BlurGate isVisible={isLoggedIn}>
              <BusinessContact biz={biz} />
            </BlurGate>

            <BlurGate isVisible={isLoggedIn}>
              <BusinessLocation biz={biz} />
            </BlurGate>

            {!isAdminView && isLoggedIn && biz.allow_reviews && (
              <div className="mt-8 border-t pt-6">
                <RatingStars value={rating} onChange={setRating} />
                <button disabled={!rating} onClick={submitRating}>
                  Submit
                </button>
                {message && <p>{message}</p>}
              </div>
            )}

            <BusinessClaim
              biz={biz}
              isLoggedIn={isLoggedIn}
              isAdminView={isAdminView}
            />
          </div>
        </main>
        
        {/* 🔥 Sticky CTA (Mobile Only) */}
        <BusinessStickyCTA
          biz={biz}
          isLoggedIn={isLoggedIn}
          isVisible={showCTA}
        />

        {showScrollTop && (
         <button
           onClick={() =>
             window.scrollTo({ top: 0, behavior: "smooth" })
           }
           className="
           fixed right-4 md:right-6
           bottom-[120px] md:bottom-6
           z-50
           bg-white/80 border border-gray-200
           shadow-lg backdrop-blur-md
           text-gray-700
           p-3 rounded-full
           hover:scale-110 hover:shadow-xl
           transition-all duration-200
           "
         >
           <ArrowUp size={18} />
         </button>
       )}   
                 
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
