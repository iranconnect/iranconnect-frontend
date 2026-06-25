//frontend/components/business/BusinessLocation.jsx
export default function BusinessLocation({ biz }) {
  if (!biz) return null;

  const isLoggedIn = biz.viewer_is_authenticated;

  const serviceMode = biz.service_mode;

  const hasAddressDetails = Boolean(
    biz.address ||
      biz.postal_code ||
      biz.city ||
      biz.country
  );

  const hasBusinessLocation = Boolean(
    hasAddressDetails || biz.location_map_url
  );

  const hasServiceBaseLocation = Boolean(
    biz.base_location_map_url
  );

  if (!hasBusinessLocation && !hasServiceBaseLocation) {
    return null;
  }

  const fullAddress = biz.address
    ? biz.address
    : [
        biz.postal_code,
        biz.city,
        biz.country,
      ]
        .filter(Boolean)
        .join(", ");

  const locationLabel =
    serviceMode === "at_home"
      ? "Business office location"
      : "Business location";

  const shouldShowBusinessLocation =
    hasBusinessLocation &&
    serviceMode !== "at_home";

  const shouldShowServiceBaseLocation =
    hasServiceBaseLocation &&
    ["at_home", "hybrid"].includes(serviceMode);

  const shouldShowFallbackBusinessLocation =
    hasBusinessLocation &&
    !shouldShowBusinessLocation &&
    !shouldShowServiceBaseLocation;

  function getEmbedUrl() {
    const mapQuery = [
      biz.address,
      biz.postal_code,
      biz.city,
      biz.country,
    ]
      .filter(Boolean)
      .join(", ");

    if (!mapQuery) {
      return null;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(
      mapQuery
    )}&output=embed`;
  }

  const embedUrl = getEmbedUrl();

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-5">
        Location
      </h2>

      <div className="space-y-6">
        {(shouldShowBusinessLocation ||
          shouldShowFallbackBusinessLocation) && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {locationLabel}
            </h3>

            {fullAddress && (
              <p className="flex items-start gap-2 text-sm text-justify-pro">
                <span>📍</span>
                <span>{fullAddress}</span>
              </p>
            )}

            {isLoggedIn && biz.location_map_url && (
              <a
                href={biz.location_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
              >
                🗺 Open business location in Google Maps
              </a>
            )}

            {isLoggedIn && embedUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <iframe
                  src={embedUrl}
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

        {shouldShowServiceBaseLocation && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Service base location
            </h3>

            <p className="text-sm text-justify-pro">
              📍 This is the base location used to calculate the business
              service area.
            </p>

            {isLoggedIn && (
              <a
                href={biz.base_location_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
              >
                🗺 Open service base location in Google Maps
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
