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
import RevealOnScroll from "../../components/ui/RevealOnScroll";

import { getCountryCallingCode } from "libphonenumber-js";

import { useAuthSession } from "../../hooks/useAuthSession";
import apiClient from "../../utils/apiClient";

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
  biz: initialBiz,
  isStaging,
}) {

  const footerRef = useRef(null);
  const reconciliationVersionRef = useRef(0);

  const { status, role } = useAuthSession();

  const [profileState, setProfileState] = useState(() => ({
    slug: initialBiz?.slug || null,
    audience: "guest",
    data: initialBiz,
  }));

  const [showCTA, setShowCTA] = useState(true);

  const hasCurrentProfile =
    profileState.slug === initialBiz?.slug;

  const biz =
    hasCurrentProfile
      ? profileState.data
      : initialBiz;

  const profileAudience =
    hasCurrentProfile
      ? profileState.audience
      : "guest";

  const isAuthReady = status !== "checking";
  const isLoggedIn = status === "authenticated";
  const isAdminView = role === "admin" || role === "superadmin";

  /*
   * SEO / structured-data source must remain Guest-safe.
   * Runtime authenticated reconciliation is UI-only.
   */
  const seoBiz = initialBiz;

  const coverImage =
    seoBiz?.cover_image_url ||
    seoBiz?.logo_url ||
    null;

  let phoneWithCode = biz?.phone || "";

  try {
    if (biz?.phone && biz?.country && /^[A-Z]{2}$/.test(biz.country)) {
      phoneWithCode = `+${getCountryCallingCode(biz.country)} ${biz.phone}`;
    }
  } catch {
    phoneWithCode = biz?.phone || "";
  }

  const metaDescription =
    buildMetaDescription(seoBiz);

  const canonicalUrl =
    `https://iranconnect.org/business/${seoBiz.slug}`;

  const shouldNoIndex =
    isStaging ||
    seoBiz?.admin_preview === true;

  const isPublicSeoPage =
    seoBiz?.admin_preview !== true;

  useEffect(() => {
    const version =
      ++reconciliationVersionRef.current;

    if (
      !initialBiz?.slug ||
      status === "checking"
    ) {
      return;
    }

    if (status !== "authenticated") {
      setProfileState({
        slug: initialBiz.slug,
        audience: "guest",
        data: initialBiz,
      });

      return;
    }

    const controller =
      new AbortController();

    /*
     * Authentication is known, but the profile DTO has not yet
     * been reconciled for this authenticated browser session.
     *
     * Keep the SSR Guest DTO as the fail-closed fallback while
     * preventing it from being treated as the authenticated DTO.
     */
    setProfileState({
      slug: initialBiz.slug,
      audience: "reconciling",
      data: initialBiz,
    });

    (async () => {
      try {
        const response =
          await apiClient.get(
            `/public-businesses/by-slug/${encodeURIComponent(
              initialBiz.slug
            )}`,
            {
              signal: controller.signal,
              skipAuthRedirect: true,
            }
          );

        if (
          controller.signal.aborted ||
          version !==
            reconciliationVersionRef.current
        ) {
          return;
        }

        setProfileState({
          slug: initialBiz.slug,
          audience: "authenticated",
          data: response.data,
        });
      } catch {
        if (
          controller.signal.aborted ||
          version !==
            reconciliationVersionRef.current
        ) {
          return;
        }

        /*
         * Fail closed: uncertainty must never preserve or
         * synthesize privileged profile data.
         */
        setProfileState({
          slug: initialBiz.slug,
          audience: "guest-fallback",
          data: initialBiz,
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    initialBiz,
    status,
  ]);

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
   
  
  const isProfileReady =
    !isLoggedIn
      ? profileAudience === "guest"
      : (
          profileAudience === "authenticated" ||
          profileAudience === "guest-fallback"
        );

  if (
    !biz ||
    !isAuthReady ||
    !isProfileReady
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  const openingHours =
    seoBiz
      ? buildOpeningHoursSchema(seoBiz)
      : null;
  return (
    <>
      <Head>
        <title>
          {seoBiz.name} in {seoBiz.city} | {seoBiz.category} | IranConnect
        </title>

        <meta
          name="description"
          content={`${seoBiz.name} - ${seoBiz.category} in ${seoBiz.city}. ${metaDescription}`}
        />

        <meta
          name="robots"
          content={shouldNoIndex ? "noindex,nofollow" : "index,follow"}
        />
        
        {isPublicSeoPage && (
          <>
            <link rel="canonical" href={canonicalUrl} />
        
            <meta property="og:title" content={seoBiz.name} />
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
                  name: seoBiz.name,
                  url: canonicalUrl,
                  logo: seoBiz.logo_url || undefined,
                  image: coverImage || undefined,
                  description: metaDescription || undefined,
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: undefined,
                    addressLocality: seoBiz.city || undefined,
                    addressCountry: seoBiz.country || undefined,
                    postalCode: undefined,
                  },
                  telephone: seoBiz.phone || undefined,
                  sameAs: [
                    seoBiz.website,
                    seoBiz.instagram_url,
                    seoBiz.facebook_url,
                    seoBiz.linkedin_url,
                    seoBiz.twitter_url,
                    seoBiz.telegram_url,
                  ].filter(Boolean),
                  ...(openingHours?.length > 0 && {
                    openingHoursSpecification: openingHours,
                  }),
                  aggregateRating:
                    seoBiz.avg_rating && seoBiz.review_count > 0
                      ? {
                          "@type": "AggregateRating",
                          ratingValue: Number(seoBiz.avg_rating),
                          reviewCount: Number(seoBiz.review_count),
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
                      name: seoBiz.category || "Category",
                      item: `https://iranconnect.org/search?category=${encodeURIComponent(
                        seoBiz.category || ""
                      )}`,
                    },
                    {
                      "@type": "ListItem",
                      position: 3,
                      name: seoBiz.name,
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
              isLoggedIn={isLoggedIn}
            />

            <RevealOnScroll className="empty:hidden">
              <BusinessAbout biz={biz} />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessInformation biz={biz} />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessGallery biz={biz} />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessReviews
                businessId={biz.id}
                isLoggedIn={isLoggedIn}
                allowReviews={biz.allow_reviews === true}
              />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessServices biz={biz} />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessContact
                biz={biz}
                phoneWithCode={phoneWithCode}
                isLoggedIn={isLoggedIn}
              />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessLocation
                biz={biz}
                isLoggedIn={isLoggedIn}
              />
            </RevealOnScroll>

            <RevealOnScroll className="empty:hidden">
              <BusinessClaim
                biz={biz}
                isLoggedIn={isLoggedIn}
                isAdminView={isAdminView}
              />
            </RevealOnScroll>
          </div>
        </main>
        
        {/* 🔥 Sticky CTA (Mobile Only) */}
        <BusinessStickyCTA
           biz={biz}
           phoneWithCode={phoneWithCode}
           isVisible={showCTA}
           isLoggedIn={isLoggedIn}
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
