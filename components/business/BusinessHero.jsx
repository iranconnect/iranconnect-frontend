//frontend/components/business/BusinessHero.jsx
import { Phone, Globe, MessageCircle } from "lucide-react";

export default function BusinessHero({ biz, phoneWithCode }) {
  const coverImage = biz.cover_image_url || biz.logo_url;

  return (
    <div className="w-full rounded-2xl overflow-hidden border bg-white shadow-sm">
      
      {/* 🔵 Cover */}
      {coverImage && (
        <div className="h-48 md:h-64 w-full relative">
          <img
            src={coverImage}
            alt={biz.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 🔵 Content */}
      <div className="p-6 md:p-8 relative">
        
        {/* 🔵 Logo floating */}
        <div className="-mt-16 mb-4">
          <img
            src={biz.logo_url || "/logo.png"}
            alt={biz.name}
            className="w-28 h-28 rounded-xl border-4 border-white object-cover shadow"
          />
        </div>

        {/* 🔵 Title */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {biz.name}
            {biz.owner_verified && (
              <span className="text-green-600 text-lg">✔</span>
            )}
          </h1>

          <p className="text-sm text-gray-500">
            {[biz.category, biz.sub_category, biz.city]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {biz.short_description && (
            <p className="text-gray-700">{biz.short_description}</p>
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
          
          {phoneWithCode && (
            <a
              href={`tel:${biz.phone}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90"
            >
              <Phone size={16} />
              Call
            </a>
          )}

          {biz.website && (
            <a
              href={biz.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
            >
              <Globe size={16} />
              Website
            </a>
          )}

          {biz.whatsapp_number && (
            <a
              href={`https://wa.me/${biz.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm hover:opacity-90"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
