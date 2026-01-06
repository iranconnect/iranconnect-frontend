//frontend/pages/business/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RatingStars from "../../components/RatingStars";
import { X } from "lucide-react";
import { getCountryCallingCode } from "libphonenumber-js";
import ClaimBusinessWidget from "../../components/ClaimBusinessWidget";
import apiClient from "../../utils/apiClient";

export default function Detail() {
  const router = useRouter();
  const { id } = router.query;

  const [biz, setBiz] = useState(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  /* ===============================
     🌗 Theme watcher (SAFE)
  =============================== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      const next =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(next);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* ===============================
     🔐 Safe auth check (NO redirect)
  =============================== */
  useEffect(() => {
    let mounted = true;

    apiClient
      .get("/auth/me", { silent: true }) // 👈 بسیار مهم
      .then(() => mounted && setIsLoggedIn(true))
      .catch(() => mounted && setIsLoggedIn(false))
      .finally(() => mounted && setAuthChecked(true));

    return () => {
      mounted = false;
    };
  }, []);

  /* ===============================
     🏢 Fetch business
  =============================== */
  useEffect(() => {
    if (!id) return;

    apiClient
      .get(`/businesses/${id}`)
      .then((res) => setBiz(res.data))
      .catch(() => setBiz(null));
  }, [id]);

  /* ===============================
     ⭐ Submit rating
  =============================== */
  async function submitRating() {
    try {
      if (!isLoggedIn) {
        setMessage("You must be logged in to rate.");
        return;
      }

      await apiClient.post(`/businesses/${id}/ratings`, { score: rating });

      setMessage("✅ Rating submitted");

      const refreshed = await apiClient.get(`/businesses/${id}`);
      setBiz(refreshed.data);
    } catch (e) {
      setMessage(e.response?.data?.error || "Error submitting rating.");
    }
  }

  /* ===============================
     ⏳ Loading states
  =============================== */
  if (!biz || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0a1d37]">
        <p>Loading...</p>
      </div>
    );
  }

  /* ===============================
     🖼 Image handling
  =============================== */
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE || "http://localhost:5000";

  const original = biz.image_url
    ? biz.image_url.startsWith("http")
      ? biz.image_url
      : `${apiBase.replace("/api", "")}${biz.image_url}`
    : "/logo.png";

  let imageSrc = original;
  if (original.startsWith("http")) {
    const filename = original.split("/").pop().split("?")[0];
    imageSrc = `${cdnBase}/cdn/${filename}?url=${encodeURIComponent(original)}`;
  }

  const phoneWithCode =
    biz?.phone && biz?.country
      ? `+${getCountryCallingCode(biz.country)} ${biz.phone}`
      : biz?.phone || "";

  const googleMapsLink =
    biz?.lat && biz?.lng
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${biz.address} @${biz.lat},${biz.lng}`
        )}`
      : null;

  const obfuscatedEmail = biz?.email
    ? biz.email.replace("@", " [at] ")
    : null;

  /* ===============================
     🧱 UI
  =============================== */
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#0a1d37",
      }}
    >
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="rounded-2xl p-8 w-full max-w-2xl border transition-all text-center md:text-left"
          style={{
            background: theme === "dark" ? "#0b2149" : "#ffffff",
            borderColor:
              theme === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
          }}
        >
          {/* --- Header --- */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img
              src={imageSrc}
              alt={biz.name}
              className="w-44 h-44 rounded-xl object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />

            <div className="flex-1 space-y-3">
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                {biz.name}
                {biz.owner_verified && <span>🎖️</span>}
              </h1>

              <p className="text-sm opacity-80">
                {biz.category} • {biz.city}
              </p>

              {biz.address && (
                <p>
                  📍{" "}
                  {isLoggedIn && googleMapsLink ? (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-turquoise hover:underline"
                    >
                      {biz.address}
                    </a>
                  ) : (
                    biz.address
                  )}
                </p>
              )}

              {isLoggedIn ? (
                <>
                  {phoneWithCode && <p>📞 {phoneWithCode}</p>}
                  {obfuscatedEmail && (
                    <p>
                      📧{" "}
                      <a
                        href={`mailto:${biz.email}`}
                        className="text-turquoise hover:underline"
                      >
                        {obfuscatedEmail}
                      </a>
                    </p>
                  )}
                  {biz.website && (
                    <p>
                      🌐{" "}
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-turquoise hover:underline"
                      >
                        Visit Website
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <button
                  className="btn-primary mt-3"
                  onClick={() =>
                    router.push(`/auth/login?redirect=/business/${id}`)
                  }
                >
                  Login to see contact info
                </button>
              )}

              <p className="text-lg font-medium text-turquoise">
                ⭐ {biz.avg_rating ?? "—"}
              </p>
            </div>
          </div>

          {/* --- Rating --- */}
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold mb-3">Rate this business</h3>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <RatingStars
                value={rating}
                onChange={setRating}
                color="#40E0D0"
              />
              <button
                className="btn-primary"
                disabled={!rating}
                onClick={submitRating}
              >
                Submit
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm">{message}</p>
            )}
          </div>

          {/* --- Claim --- */}
          <div className="mt-10 border-t pt-6 text-center">
            {biz.owner_verified ? (
              <p className="text-green-600">
                🎖️ Verified by owner
              </p>
            ) : isLoggedIn ? (
              <ClaimBusinessWidget businessId={id} />
            ) : (
              <button
                className="btn-primary"
                onClick={() =>
                  router.push(`/auth/login?redirect=/business/${id}`)
                }
              >
                Claim this business
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* --- Image modal --- */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl w-full px-4">
            <button className="absolute -top-8 right-2 text-white">
              <X size={28} />
            </button>
            <img
              src={imageSrc}
              alt={biz.name}
              className="rounded-xl w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
