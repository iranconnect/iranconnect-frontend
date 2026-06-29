//frontend/components/business/BusinessLocation.jsx
function normalizeExternalUrl(value) {
  if (!value) return null;

  const rawValue = String(value).trim();

  if (!rawValue) return null;

  const candidate = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const parsed = new URL(candidate);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

export default function BusinessLocation({ biz }) {
  if (!biz) {
    return null;
  }

  const serviceMode = String(
    biz.service_mode || ""
  ).trim();

  const isOnSite = serviceMode === "on_site";
  const isAtHome = serviceMode === "at_home";
  const isHybrid = serviceMode === "hybrid";
  const isRemote = serviceMode === "remote";

  const shouldShowBusinessLocation =
    isOnSite || isHybrid;

  const shouldShowBaseLocation =
    isAtHome || isHybrid;

  if (isRemote) {
    return null;
  }

  const businessMapUrl = normalizeExternalUrl(
    biz.location_map_url
  );

  const baseLocationMapUrl = normalizeExternalUrl(
    biz.base_location_map_url
  );

  const addressParts = [
    biz.address,
    [biz.postal_code, biz.city]
      .filter(Boolean)
      .join(" "),
    biz.country,
  ].filter(Boolean);

  const fullAddress = addressParts.join(", ");

  const hasBusinessLocation =
    shouldShowBusinessLocation &&
    (Boolean(fullAddress) || Boolean(businessMapUrl));

  /*
    طبق Policy فعلی، Base Location فقط در سطح شهر ثبت می‌شود.
    بنابراین نقشه Embed از city + country ساخته می‌شود،
    نه از Google Maps short link.
  */
  const baseLocationLabel = [
    biz.city,
    biz.country,
  ]
    .filter(Boolean)
    .join(", ");

  const baseLocationEmbedUrl = baseLocationLabel
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        baseLocationLabel
      )}&output=embed`
    : null;

  const hasBaseLocation =
    shouldShowBaseLocation &&
    (Boolean(baseLocationMapUrl) ||
      Boolean(baseLocationEmbedUrl));

  if (!hasBusinessLocation && !hasBaseLocation) {
    return null;
  }

  const addressEmbedUrl = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        fullAddress
      )}&output=embed`
    : null;

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-5">
        Location
      </h2>

      <div className="space-y-6">
        {hasBusinessLocation && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Business address
            </h3>

            {fullAddress && (
              <p className="flex items-start gap-2 text-sm text-justify-pro">
                <span aria-hidden="true">📍</span>
                <span>{fullAddress}</span>
              </p>
            )}

            {businessMapUrl && (
              <a
                href={businessMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
              >
                <span aria-hidden="true">🗺</span>
                Open business location in Google Maps
              </a>
            )}

            {addressEmbedUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <iframe
                  src={addressEmbedUrl}
                  title={`${biz.name} business location map`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}

        {hasBaseLocation && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Service base location
            </h3>

            <p className="text-sm text-justify-pro">
              📍 Service coverage begins from this city.
            </p>

            {baseLocationLabel && (
              <p className="mt-2 text-sm text-muted">
                {baseLocationLabel}
              </p>
            )}

            {baseLocationMapUrl && (
              <a
                href={baseLocationMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-turquoise hover:underline"
              >
                <span aria-hidden="true">🗺</span>
                Open service base location in Google Maps
              </a>
            )}

            {baseLocationEmbedUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <iframe
                  src={baseLocationEmbedUrl}
                  title={`${biz.name} service base location map`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
