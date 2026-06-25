//frontend/components/business/BusinessLocation.jsx
export default function BusinessLocation({ biz }) {
  if (!biz) return null;

  const isLoggedIn = biz.viewer_is_authenticated === true;

  const hasAddress = Boolean(
    biz.address ||
      biz.postal_code ||
      biz.city ||
      biz.country
  );

  const hasBusinessMap = Boolean(biz.location_map_url);
  const hasBaseMap = Boolean(biz.base_location_map_url);

  if (!hasAddress && !hasBusinessMap && !hasBaseMap) {
    return null;
  }

  const addressParts = [
    biz.address,
    [biz.postal_code, biz.city]
      .filter(Boolean)
      .join(" "),
    biz.country,
  ].filter(Boolean);

  const fullAddress = addressParts.join(", ");

  const businessLocationTitle =
    biz.service_mode === "at_home"
      ? "Registered business address"
      : "Business location";

  function getAddressEmbedUrl() {
    if (!fullAddress) return null;

    return `https://www.google.com/maps?q=${encodeURIComponent(
      fullAddress
    )}&output=embed`;
  }

  const addressEmbedUrl = getAddressEmbedUrl();

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-5">
        Location
      </h2>

      <div className="space-y-6">
        {(hasAddress || hasBusinessMap) && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {businessLocationTitle}
            </h3>

            {fullAddress && (
              <p className="flex items-start gap-2 text-sm text-justify-pro">
                <span>📍</span>
                <span>{fullAddress}</span>
              </p>
            )}

            {hasBusinessMap && (
              <a
                href={biz.location_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
              >
                🗺 Open business location in Google Maps
              </a>
            )}

            {isLoggedIn && addressEmbedUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <iframe
                  src={addressEmbedUrl}
                  title={`${biz.name} business location`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}

        {hasBaseMap && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Service base location
            </h3>

            <p className="text-sm text-justify-pro">
              📍 This location is used as the service base for customer-area
              coverage.
            </p>

            <a
              href={biz.base_location_map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
            >
              🗺 Open service base location in Google Maps
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
