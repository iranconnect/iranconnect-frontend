//frontend/components/business/BusinessLocation.jsx
export default function BusinessLocation({ biz }) {
  if (!biz) return null;

  const fullAddress = [
    biz.address,
    biz.postal_code,
    biz.city,
    biz.country,
  ]
    .filter(Boolean)
    .join(", ");

  const mapUrl =
    biz.location_map_url ||
    biz.base_location_map_url ||
    null;

  // Extract embed src from Google Maps URL
  function getEmbedUrl(biz) {
    // 1️⃣ اگر link گوگل داریم → extract query
    if (biz.location_map_url) {
      try {
        const url = new URL(biz.location_map_url);
  
        // حالت Google Maps معمولی
        const query = url.searchParams.get("q");
  
        if (query) {
          return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
        }
  
        // fallback → کل url رو به عنوان query استفاده نکن!
      } catch {}
    }
  
    // 2️⃣ fallback → استفاده از آدرس
    const address = [
      biz.address,
      biz.city,
      biz.country,
    ]
      .filter(Boolean)
      .join(", ");
  
    if (!address) return null;
  
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }

  const embedUrl = getEmbedUrl(biz);

  if (!fullAddress && !mapUrl) return null;

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Location
      </h2>

      {/* Address */}
      {fullAddress && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 flex items-start gap-2">
            <span>📍</span>
            <span>{fullAddress}</span>
          </p>
        </div>
      )}

      {/* Open in Maps */}
      {mapUrl && (
        <div className="mb-4">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            🗺 Open in Google Maps
          </a>
        </div>
      )}

      {/* Map Embed */}
      {embedUrl && (
        <div className="rounded-xl overflow-hidden border">
          <iframe
            src={embedUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
