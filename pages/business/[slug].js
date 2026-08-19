//pages/business/[slug].js 
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BusinessHero from "../../components/business/BusinessHero";
import BusinessAbout from "../../components/business/BusinessAbout";
import BusinessServices from "../../components/business/BusinessServices";   
import BusinessLocation from "../../components/business/BusinessLocation";
import BusinessGallery from "../../components/business/BusinessGallery";
import BusinessReviews from "../../components/business/BusinessReviews";
import BusinessClaim from "../../components/business/BusinessClaim";
import BusinessContact from "../../components/business/BusinessContact";
import BusinessStickyCTA from "../../components/business/BusinessStickyCTA";
import BusinessInformation from "../../components/business/BusinessInformation";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";

import { getCountryCallingCode } from "libphonenumber-js";

import { useAuthSession } from "../../hooks/useAuthSession";

/* ======================================================
   SSR — Fetch business by slug
====================================================== */
export async function getServerSideProps(context) {
   
  const { slug } = context.params;
  const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE;

  if (!apiBase) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE is not defined"
    );
  }

  const cookie = context.req.headers.cookie || "";

  // 🔥 STEP 1: اگر ID بود → redirect
  if (/^\d+$/.test(slug)) {
    try {
      const res = await fetch(
        `${apiBase}/businesses/id-to-slug/${slug}`
      );

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

function buildOpeningHoursSchema(biz) {
  if (!biz) return null;

  const result = [];

  const dayMap = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const addOpeningHours = (day, open, close) => {
    if (!dayMap[day] || !open || !close) {
      return;
    }

    result.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayMap[day],
      opens: String(open).trim(),
      closes: String(close).trim(),
    });
  };

  /*
    پشتیبانی از هر دو ساختار:

    ساختار جدید:
    {
      monday: {
        open: "09:00",
        close: "18:00",
        closed: false
      }
    }

    ساختار قدیمی:
    {
      monday: ["09:00-18:00"]
    }
  */
  if (
    (
      biz.availability_type === "business_hours" ||
      biz.availability_type === "appointment_only"
    ) &&
    biz.availability_hours &&
    typeof biz.availability_hours === "object"
  ) {
    Object.entries(biz.availability_hours).forEach(
      ([day, dayHours]) => {
        if (!dayHours) {
          return;
        }

        // ساختار جدید Object
        if (
          !Array.isArray(dayHours) &&
          typeof dayHours === "object"
        ) {
          if (dayHours.closed === true) {
            return;
          }

          addOpeningHours(
            day,
            dayHours.open,
            dayHours.close
          );

          return;
        }

        // ساختار قدیمی Array
        if (Array.isArray(dayHours)) {
          dayHours.forEach((range) => {
            if (typeof range !== "string") {
              return;
            }

            const [open, close] = range.split("-");

            addOpeningHours(day, open, close);
          });
        }
      }
    );
  }

  /*
    Fallback برای Businessهای قدیمی که ساعات فقط
    در availability_note نوشته شده‌اند.
  */
  if (result.length === 0 && biz.availability_note) {
    const lines = biz.availability_note.match(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(.*)/gi
    );

    if (lines) {
      lines.forEach((line) => {
        const [day, hours] = line.split(":");

        if (!hours || hours.toLowerCase().includes("closed")) {
          return;
        }

        const [open, close] = hours.trim().split("-");

        addOpeningHours(
          day.trim().toLowerCase(),
          open,
          close
        );
      });
    }
  }

  return result.length > 0 ? result : null;
}
/* ======================================================
   Page
====================================================== */
export default function BusinessBySlug({
  biz,
  isStaging,
}) {

  const footerRef = useRef(null); 
  const { status, role } = useAuthSession();


  const [showCTA, setShowCTA] = useState(true); 

  const isAuthReady = status !== "checking";
  const isLoggedIn = status === "authenticated";
  const isAdminView = role === "admin" || role === "superadmin";

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

  const shouldNoIndex =
    isStaging || biz?.admin_preview === true;

  const isPublicSeoPage = biz?.admin_preview !== true; 

  useEffect(() => {
    function handleCTAVisibility() {
      const footer = footerRef.current;
      if (!footer) return;

      const footerTop = footer.getBoundingClientRect().top;
      const screenHeight = window.innerHeight;

      // 👇 وقتی footer نزدیک شد → CTA hide
      if (footerTop < screenHeight - 120) {
        setShowCTA(false);
      } else {
        setShowCTA(true);
      }
    }

    window.addEventListener("scroll", handleCTAVisibility);
    handleCTAVisibility(); // initial check

    return () => window.removeEventListener("scroll", handleCTAVisibility);
  }, []);
   
  
  if (!biz || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  const openingHours = biz ? buildOpeningHoursSchema(biz) : null; 
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

        <meta
          name="robots"
          content={shouldNoIndex ? "noindex,nofollow" : "index,follow"}
        />
        
        {isPublicSeoPage && (
          <>
            <link rel="canonical" href={canonicalUrl} />
        
            <meta property="og:title" content={biz.name} />
            <meta
              property="og:description"
              content={metaDescription}
            />
            {coverImage && (
              <meta property="og:image" content={coverImage} />
            )}
            <meta property="og:type" content="business.business" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content="IranConnect" />
            <meta property="og:locale" content="en_US" />
            <meta
              name="twitter:card"
              content="summary_large_image"
            />
        
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
                  ...(openingHours?.length > 0 && {
                    openingHoursSpecification: openingHours,
                  }),
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
          </>
        )}
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />

        <main
           className="flex-1 flex items-center justify-center px-4 py-4 md:pb-4"
           style={{
             backgroundColor: "#ffffff",
             paddingBottom: "40px",
           }}
         >
          <div className="w-full max-w-5xl space-y-8">
            {biz?.admin_preview === true && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
                Admin preview: this business is currently private or unpublished and is visible here because you are logged in as an admin.
              </div>
            )}

            <BusinessHero
              biz={biz}
              phoneWithCode={phoneWithCode}
            />

            <BusinessAbout biz={biz} />

            <BusinessInformation biz={biz} />

            <BusinessGallery biz={biz} />

            <BusinessReviews
              businessId={biz.id}
              isLoggedIn={isLoggedIn}
              allowReviews={biz.allow_reviews === true}
            />

            <BusinessServices biz={biz} />

            <BusinessContact
              biz={biz}
              phoneWithCode={phoneWithCode}
            />

            <BusinessLocation biz={biz} />

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
           phoneWithCode={phoneWithCode}
           isVisible={showCTA}
         />

        <ScrollToTopButton
          avoidMobileStickyCTA
        />
        <div id="cta-sentinel" className="h-1 w-full" />         
        <div ref={footerRef}>
          <Footer />
        </div>
      </div>
    </>
  );
}
