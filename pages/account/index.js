/*frontend/pages/account/index.js*/
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { useAuthSession } from "../../hooks/useAuthSession";
import AccountLayout from "../../components/account/AccountLayout";

export default function AccountPage() {
  const { status, user, role } = useAuthSession();

  const loading =
    status === "checking" ||
    (status === "authenticated" && !user);

  const [theme, setTheme] = useState("light");

  
  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);
  
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme"));
    });
  
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  
    return () => obs.disconnect();
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

  const createdRaw =
    user?.createdAt ||
    null;
  
  const memberSince = createdRaw
    ? new Date(createdRaw).toISOString().slice(0, 10)
    : null;

  return (
    <AccountLayout>
      <div className="flex flex-col justify-center items-center p-4">
        <div
          className="rounded-2xl p-8 w-full max-w-md border transition-all duration-300"
          style={{
            background: theme === "dark" ? "#0b2149" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#0a1b2a",
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            boxShadow:
              theme === "dark"
                ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
                : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-6">
            My Account 👤
          </h2>

          <div className="space-y-3 mb-6 text-sm">
            <p><strong>Email:</strong> {user?.email || "—"}</p>
            <p><strong>Role:</strong> {role}</p>
          
            {memberSince && (
              <p>
                <strong>Member since:</strong> {memberSince}
              </p>
            )}
          </div>


          <button
            onClick={logout}
            className="w-full bg-turquoise text-navy py-2 rounded-lg font-medium shadow-md hover:bg-turquoise/90 transition-all duration-200"
          >
            Log Out
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}
