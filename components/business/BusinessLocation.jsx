//frontend/components/business/BusinessLocation.jsx
export default function BusinessLocation({ biz }) {
  if (!biz) return null;

  const isLoggedIn = biz.viewer_is_authenticated; // ✅ FIX

  const fullAddress = biz.address
  ? biz.address
  : [
      biz.postal_code,
      biz.city,
      biz.country,
    ].filter(Boolean).join(", ");
  
  const mapUrl =
    biz.location_map_url ||
    biz.base_location_map_url ||
    null;

  function getEmbedUrl(biz) {
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
    <div className="card mt-6">
    {/*<div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6">*/}
      <h2 className="text-xl font-semibold mb-4">Location</h2>

      {fullAddress && (
        <div className="mb-4">
          <p className="text-sm text-sm text-justify-pro flex items-start gap-2">
            <span>📍</span>
            <span>{fullAddress}</span>
          </p>
        </div>
      )}

      {isLoggedIn && mapUrl && (
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

      {embedUrl && (
        <div className={!isLoggedIn ? "blur-sm pointer-events-none" : ""}>
          <iframe
            src={embedUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
