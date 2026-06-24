//frontend/components/business/BusinessHero.jsx
import { useEffect, useState } from "react";
import { Phone, Globe, MessageCircle } from "lucide-react";

export default function BusinessHero({ biz, phoneWithCode, isLoggedIn }) {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
      const syncTheme = () => {
        const currentTheme =
          document.documentElement.getAttribute("data-theme") || "light";
  
        setTheme(currentTheme);
      };
  
      syncTheme();
  
      const observer = new MutationObserver(syncTheme);
  
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
  
      return () => observer.disconnect();
    }, []);
  
    const fallbackLogo =
      theme === "dark"
        ? "/logo-dark.png"
        : "/logo-light.png";
  
  const coverImage = biz.cover_image_url || biz.logo_url;

  return (
      <div className="card mt-6">
      
      
      {/* 🔵 Cover / reserved hero space */}
      <div className="h-48 md:h-64 w-full relative overflow-hidden rounded">
        {coverImage && (
          <img
            src={coverImage}
            alt={`${biz.name} cover`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 🔵 Content */}
      <div className="pb-6 md:pb-8 pt-20 md:pt-24 relative space-y-4">
        
        {/* 🔵 Logo floating */}
        <div className="absolute -top-14 left-6 md:left-8">
          <img
            src={biz.logo_url || fallbackLogo}
            alt={`${biz.name} logo`}
            className="w-28 h-28 rounded-xl border-[var(--bg)] object-cover shadow"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackLogo;
            }}
          />
        </div>

        {/* 🔵 Title */}
        <div className="space-y-2 max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {biz.name}
            {biz.owner_verified && (
              <span className="ml-2 text-turquoise text-xl md:text-2xl align-middle">
                🎖️
              </span>
            )}
          </h1>

          <p className="text-sm text-justify-pro">
            {[
              biz.category,
              biz.sub_category,
              [biz.city, biz.country].filter(Boolean).join(", "),
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {biz.short_description && (
            <p className="text-sm text-justify-pro">{biz.short_description}</p>
          )}
          {biz.address && (
            <p className={`text-sm text-sm text-justify-pro ${!isLoggedIn ? "blur-sm" : ""}`}>
              📍{" "}
              {biz.location_map_url ? (
                <a href={biz.location_map_url} target="_blank" rel="noreferrer">
                  {biz.address}
                </a>
              ) : (
                biz.address
              )}
            </p>
          )}

          {biz.service_mode && (
            <p className={`text-sm text-sm text-justify-pro ${!isLoggedIn ? "blur-sm" : ""}`}>
              {biz.service_mode === "on_site" && "🏢 On-site"}
              {biz.service_mode === "at_home" && "🚗 At home"}
              {biz.service_mode === "remote" && "💻 Remote"}
              {biz.service_mode === "hybrid" && "🔄 Hybrid"}
            </p>
          )}
          {biz.availability_note && (
            <p className="text-sm text-justify-pro">
              🕒 {biz.availability_note}
            </p>
          )}
          {/* 🔵 Rating */}
          <p className="text-lg font-medium">
            ⭐ {biz.avg_rating ?? "—"}{" "}
            {typeof biz.review_count === "number" &&
              `(${biz.review_count} reviews)`}
          </p>
        </div>

        {/* 🔵 CTA Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">

          {isLoggedIn ? (
            <>
              {phoneWithCode && (
                <a
                  href={`tel:${biz.phone}`}
                  className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
                >
                  <Phone size={16} />
                  Call
                </a>
              )}
        
              
        
              {biz.whatsapp_number && (
                <a
                  href={`https://wa.me/${biz.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary !w-auto flex items-center gap-2 text-sm px-4 py-2"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}

              {biz.website && (
                <a
                  href={biz.website}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !w-auto flex items-center gap-2 text-sm px-4 py-2"
                >
                  <Globe size={16} />
                  Website
                </a>
              )}
            </>
          ) : (
            <button
              onClick={() =>
                window.location.href = `/auth/login?redirect=/business/${biz.slug}`
              }
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#3fd0c9] to-[#2aa7a1] text-white font-medium hover:opacity-90"
            >
              Login to see full details and reviews
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
