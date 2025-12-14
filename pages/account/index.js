/*frontend/pages/account/index.js*/
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import apiClient from "../../utils/apiClient";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Fetch authenticated user (HttpOnly cookie)
  useEffect(() => {
    apiClient
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        // اگر سشن معتبر نباشد → ریدایرکت
        window.location.href = "/auth/login";
      });
  }, []);

  // 🔐 Secure logout (invalidate server session)
  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // حتی اگر خطا بدهد، ادامه می‌دهیم
    }

    // هیچ localStorage مربوط به auth نداریم
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex justify-center items-center">
          <p className="text-gray-500 text-sm">Loading account info...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-navy text-center mb-6">
            My Account 👤
          </h2>

          <div className="space-y-3 mb-6 text-sm text-gray-700">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Verified:</strong>{" "}
              {user.is_verified ? (
                <span className="text-green-600 font-medium">Yes ✅</span>
              ) : (
                <span className="text-red-500 font-medium">No ❌</span>
              )}
            </p>
          </div>

          {/* 🔐 Secure logout */}
          <button
            onClick={logout}
            className="w-full mt-6 border border-gray-300 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all"
          >
            Log Out
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-3">
        © {new Date().getFullYear()} IranConnect. All rights reserved.
      </footer>
    </div>
  );
}
