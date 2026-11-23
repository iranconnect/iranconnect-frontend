// PLR-10 — Approximate IP-based location.
// No GPS, IP persistence, or external geolocation service.

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      countryCode: null,
      city: null,
    });
  }

  const rawCountry = req.headers["x-vercel-ip-country"];
  const rawCity = req.headers["x-vercel-ip-city"];

  const countryCode =
    typeof rawCountry === "string" &&
    /^[A-Za-z]{2}$/.test(rawCountry)
      ? rawCountry.toUpperCase()
      : null;

  let city = null;

  if (countryCode && typeof rawCity === "string") {
    try {
      const decoded = decodeURIComponent(rawCity).trim();

      if (
        decoded.length > 0 &&
        decoded.length <= 100 &&
        !/[\u0000-\u001F\u007F]/.test(decoded)
      ) {
        city = decoded;
      }
    } catch {
      city = null;
    }
  }

  return res.status(200).json({
    countryCode,
    city,
  });
}
