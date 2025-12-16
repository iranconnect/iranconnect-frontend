//frontend/pages/business/[id].js
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
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

  /* --------------------------------------------------
     🎨 Theme sync
  -------------------------------------------------- */
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);

    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.getAttribute("data-theme") || "light"
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  /* --------------------------------------------------
     🔐 Auth status
  -------------------------------------------------- */
  useEffect(() => {
    apiClient
      .get("/auth/me", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  /* --------------------------------------------------
     📦 Fetch business
  -------------------------------------------------- */
  useEffect(() => {
    if (!id) return;

    apiClient
      .get(`/businesses/${id}`)
      .then((res) => setBiz(res.data))
      .catch(console.error);
  }, [id]);

  /* --------------------------------------------------
     ⭐ Rating
  -------------------------------------------------- */
  async function submitRating() {
    try {
      if (!isLoggedIn) {
        setMessage("You must be logged in to rate.");
        return;
      }

      await apiClient.post(
        `/businesses/${id}/ratings`,
        { score: rating },
        { withCredentials: true }
      );

      setMessage("✅ Rating submitted");

      const refreshed = await apiClient.get(`/businesses/${id}`);
      setBiz(refreshed.data);
    } catch (e) {
      setMessage(e.response?.data?.error || "Error submitting rating.");
    }
  }

  if (!biz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0a1d37]">
        <p>Loading...</p>
      </div>
    );
  }

  /* --------------------------------------------------
     🖼️ Image resolver (SAFE & FINAL)
  -------------------------------------------------- */
  const imgErrored = useRef(false);

  const isSafeHttpUrl = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  let imageSrc = "/logo-light.png"; // ✅ real fallback

  if (biz?.image_url && isSafeHttpUrl(biz.image_url)) {
    imageSrc = biz.image_url;
  } else if (biz?.logo_url && isSafeHttpUrl(biz.logo_url)) {
    imageSrc = biz.logo_url;
  }

  /* --------------------------------------------------
     📞 Contact helpers
  -------------------------------------------------- */
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

  /* --------------------------------------------------
     🧱 Render
  -------------------------------------------------- */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#0a1d37",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          className="rounded-2xl p-8 w-full max-w-2xl border transition-all duration-300 text-center md:text-left"
          style={{
            background: theme === "dark" ? "#0b2149" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#0a1b2a",
            borderColor:
              theme === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            boxShadow:
              theme === "dark"
                ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
                : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
          }}
        >
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <img
              src={imageSrc}
              alt={biz.name}
              className="w-40 h-40 md:w-48 md:h-48 rounded-xl object-cover border border-gray-300 shadow-md cursor-pointer hover:opacity-90 transition mx-auto md:mx-0"
              onClick={() => setShowImageModal(true)}
              onError={(e) => {
                if (imgErrored.current) return;
                imgErrored.current = true;
                e.currentTarget.src = "/logo-light.png";
              }}
            />

            <div className="flex-1 flex flex-col items-center md:items-start space-y-3 leading-relaxed">
              <h1 className="text-2xl font-semibold flex flex-col md:flex-row items-center gap-2">
                <span>{biz.name}</span>
                {biz.owner_verified && <span>🎖️</span>}
              </h1>

              <p
                className="text-sm"
                style={{ color: theme === "dark" ? "#e2e8f0" : "#555" }}
              >
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
                <div className="space-y-2">
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
                </div>
              ) : (
                <button
                  className="btn-primary mt-3"
                  onClick={() =>
                    router.push(`/auth/login?redirect=/business/${id}`)
                  }
                >
                  Login to see contact information
                </button>
              )}

              <p className="pt-2 text-lg font-medium text-turquoise">
                ⭐ {biz.avg_rating ?? "—"}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Rate this business</h3>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <RatingStars value={rating} onChange={setRating} color="#40E0D0" />

              <button
                className="btn-primary"
                onClick={submitRating}
                disabled={!rating}
              >
                Submit
              </button>
            </div>

            {message && (
              <p
                className={`mt-3 text-sm ${
                  message.includes("✅") ? "text-green-500" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Claim */}
          <div className="mt-10 border-t pt-6 text-center">
            {biz.owner_verified ? (
              <div className="text-green-600 font-medium">
                🎖️ This business has been verified by its owner.
              </div>
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

      {/* Image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl w-full px-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-8 right-2 text-white hover:text-turquoise"
            >
              <X size={28} />
            </button>

            <img
              src={imageSrc}
              alt={biz.name}
              className="rounded-2xl w-full h-auto max-h-[85vh] object-contain shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
