//frontend/components/business/BusinessReviews.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function BusinessReviews({ businessId, isLoggedIn }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    apiClient
      .get(`/businesses/${businessId}/reviews`)
      .then((res) => {
        setReviews(res.data?.data || []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading reviews...</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No reviews yet
      </p>
    );
  }

  const avg =
    reviews.reduce((acc, r) => acc + r.rating, 0) /
    reviews.length;

  if (!isLoggedIn) {
    return (
      <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
  
        <p className="text-sm text-gray-500 mb-4">
          Login to see reviews and submit your rating
        </p>
  
        <button
          onClick={() =>
            window.location.href = `/auth/login?redirect=/business/${businessId}`
          }
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3fd0c9] to-[#2aa7a1] text-white"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Reviews
      </h2>

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

      {/* 🧾 List */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">
                User #{r.user_id}
              </span>
              <span className="text-yellow-500 text-sm">
                {"★".repeat(r.rating)}
              </span>
            </div>

            {r.comment && (
              <p className="text-sm text-gray-700">
                {r.comment}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
