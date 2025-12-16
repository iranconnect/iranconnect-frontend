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

  /* ---------------- THEME ---------------- */
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

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    apiClient
      .get("/auth/me", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  /* ---------------- FETCH BUSINESS ---------------- */
  useEffect(() => {
    if (!id) return;

    apiClient
      .get(`/businesses/${id}`)
      .then((res) => setBiz(res.data))
      .catch(console.error);
  }, [id]);

  /* ---------------- RATING ---------------- */
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

  /* ---------------- IMAGE SAFE ---------------- */
  const imgErrored = useRef(false);

  const isSafeUrl = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  let imageSrc = "/logo-light.png";

  if (biz.image_url && isSafeUrl(biz.image_url)) {
    imageSrc = biz.image_url;
  }

  /* ---------------- PHONE SAFE ---------------- */
  let phoneWithCode = "";

  if (biz.phone) {
    try {
      if (biz.country) {
        phoneWithCode = `+${getCountryCallingCode(biz.country)} ${biz.phone}`;
      } else {
        phoneWithCode = biz.phone;
      }
    } catch {
      phoneWithCode = biz.phone;
    }
  }

  const googleMapsLink =
    biz.lat && biz.lng
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${biz.address} @${biz.lat},${biz.lng}`
        )}`
      : null;

  const obfuscatedEmail = biz.email
    ? biz.email.replace("@", " [at] ")
    : null;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-2xl p-8 shadow-lg bg-white">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={imageSrc}
              alt={biz.name}
              className="w-40 h-40 rounded-xl object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
              onError={(e) => {
                if (imgErrored.current) return;
                imgErrored.current = true;
                e.currentTarget.src = "/logo-light.png";
              }}
            />

            <div className="flex-1 space-y-2 text-center md:text-left">
              <h1 className="text-2xl font-semibold">
                {biz.name} {biz.owner_verified && "🎖️"}
              </h1>

              <p className="text-gray-500">
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
                      className="text-turquoise"
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
                  {obfuscatedEmail && <p>📧 {obfuscatedEmail}</p>}
                </>
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

              <p className="text-turquoise font-medium">
                ⭐ {biz.avg_rating ?? "—"}
              </p>
            </div>
          </div>

          {/* RATING */}
          <div className="mt-8 border-t pt-6">
            <RatingStars value={rating} onChange={setRating} color="#40E0D0" />
            <button
              className="btn-primary mt-3"
              onClick={submitRating}
              disabled={!rating}
            >
              Submit
            </button>
            {message && <p className="mt-2 text-sm">{message}</p>}
          </div>

          {/* CLAIM — نسخه درست */}
          <div className="mt-10 border-t pt-6 text-center">
            {biz.owner_verified ? (
              <p className="text-green-600">
                🎖️ This business has been verified by its owner.
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

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={imageSrc}
            alt={biz.name}
            className="max-h-[85vh] rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-6 right-6 text-white">
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
