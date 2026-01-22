/*frontend/pages/account/index.js*/
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import AccountLayout from "../../components/account/AccountLayout";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // فقط fetch داده — auth gate در AccountLayout
  useEffect(() => {
    apiClient.get("/auth/me").then((res) => {
      setUser(res.data);
      setLoading(false);
    });
  }, []);

  async function logout() {
    try {
      await apiClient.post("/auth/logout", {}, { withCredentials: true });
    } catch {}
  
    window.location.href = "/search";
  }


  if (loading) {
    return (
      <AccountLayout>
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 text-sm">Loading account info...</p>
        </div>
      </AccountLayout>
    );
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toISOString().slice(0, 10)
    : null;


  return (
    <AccountLayout>
      <div className="flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-navy text-center mb-6">
            My Account 👤
          </h2>

          <div className="space-y-3 mb-6 text-sm text-gray-700">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          
            {memberSince && (
              <p>
                <strong>Member since:</strong> {memberSince}
              </p>
            )}
          </div>


          <button
            onClick={logout}
            className="w-full mt-6 border border-gray-300 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}
