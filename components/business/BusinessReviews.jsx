//frontend/components/business/BusinessReviews.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function BusinessReviews({ businessId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [userRating, setUserRating] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function submitRating() {
    try {
      setSubmitting(true);
      setMessage("");
  
      await apiClient.post(
        `/businesses/${businessId}/reviews`,
        { rating }
      );
  
      if (userRating) {
        setMessage("✅ Rating updated");
      } else {
        setMessage("✅ Rating submitted");
      }

      setUserRating(rating);

      await apiClient
        .get(`/businesses/${businessId}/reviews`)
        .then((res) => {
          setReviews(res.data?.data || []);
          setUserRating(res.data?.user_review?.rating || null);
        });
  
    } catch (e) {
      setMessage(e.response?.data?.error || "Error submitting rating.");
    } finally {
      setSubmitting(false);
    }
  }  
  useEffect(() => {
    if (!businessId) return;

    apiClient
      .get(`/businesses/${businessId}/reviews`)
      .then((res) => {
        setReviews(res.data?.data || []);
        setUserRating(res.data?.user_review?.rating || null);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => {
    apiClient
      .get("/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    if (userRating) {
      setRating(userRating);
    }
  }, [userRating]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading reviews...</p>;
  }

  const avg = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;



  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Reviews
      </h2>

      {/* ⭐ Submit Rating (only if logged in) */}
      
        <div className="mb-6">
          
          {userRating && (
            <p className="text-sm text-green-600 mb-2">
              ⭐ Your rating: {userRating} (you can update it)
            </p>
          )}
      
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? "text-yellow-500" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
      
          <button
            disabled={!isLoggedIn || !rating || submitting}
            onClick={submitRating}
            className="px-4 py-2 bg-[#2aa7a1] text-white rounded-lg disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : userRating
              ? "Update Rating"
              : "Submit Rating"}
          </button>
      
          {message && (
            <p className="text-sm mt-2 text-gray-600">{message}</p>
          )}
        </div>
      

      {/* ⭐ Summary */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl font-bold">
          {avg.toFixed(1)}
        </div>
        <div className="text-yellow-500">
          {"★".repeat(Math.round(avg))}
        </div>
        <div className="text-sm text-gray-500">
          ({reviews.length} reviews)
        </div>
      </div>
    </div>
  );
}
