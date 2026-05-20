/*frontend/pages/account/update-business.js*/
'use client';

import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import apiClient from "../../utils/apiClient";

export default function UpdateBusinessRequest() {

const [businesses, setBusinesses] = useState([]);
const [selectedBusiness, setSelectedBusiness] = useState("");
const [prefillData, setPrefillData] = useState(null);



const [theme, setTheme] = useState("light");

const [loading, setLoading] = useState(false);
const [msg, setMsg] = useState("");
const [ticket, setTicket] = useState("");



/* ============================================================
THEME
============================================================ */

useEffect(() => {

const current =
document.documentElement.getAttribute("data-theme") || "light";

setTheme(current);

const obs = new MutationObserver(() => {


const newTheme =
  document.documentElement.getAttribute("data-theme") || "light";

setTheme(newTheme);


});

obs.observe(document.documentElement, {
attributes: true,
attributeFilter: ["data-theme"],
});

return () => obs.disconnect();

}, []);


/* ============================================================
LOAD OWNED BUSINESSES
============================================================ */

useEffect(() => {

  apiClient
    .get("/requests/owned-businesses")
    .then((res) => {
      setBusinesses(res.data || []);
    })
    .catch(() => {
      setBusinesses([]);
    });

}, []); 


/* ============================================================
LOAD BUSINESS PREFILL
============================================================ */

useEffect(() => {

if (!selectedBusiness) return;

async function loadBusiness() {


try {

  const res = await apiClient.get(
    `/requests/business-prefill/${selectedBusiness}`
  );

  const data = res.data;

  setPrefillData(data);
  
} catch (err) {
  console.error(err);
}


}

loadBusiness();

}, [selectedBusiness]);



/* ============================================================
STYLES
============================================================ */

const sectionStyle = {
border: "1px solid rgba(0,0,0,0.06)",
borderRadius: "16px",
padding: "20px",
marginBottom: "20px",
background:
theme === "dark"
? "#0b2149"
: "#ffffff",


boxShadow:
  theme === "dark"
    ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
    : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",


};

const inputClass =
"w-full p-3 rounded-lg border shadow-inner focus:outline-none focus:ring-2 focus:ring-turquoise transition-all duration-200 " +
(
theme === "dark"
? "bg-[#153b78] text-white border-gray-600"
: "bg-[#f5f7fa] text-gray-900 border-gray-300"
);

/* ============================================================
UI
============================================================ */

return ( <AccountLayout>


  <main className="flex-1 px-4 py-6 md:py-8">

    <div className="mx-auto w-full max-w-5xl">

      <h2
        className="text-2xl font-semibold text-center mb-6"
        style={{ color: "#0A1D37" }}
      >
        Update Business Request
      </h2>

      <div>

        <div style={sectionStyle}>

          <h3 className="font-semibold mb-4">
            Select Business
          </h3>

          <select
            className={inputClass}
            value={selectedBusiness}
            onChange={(e) =>
              setSelectedBusiness(e.target.value)
            }
          >
            <option value="">
              Select business
            </option>

            {businesses.map((b) => (
              <option
                key={b.id}
                value={b.id}
              >
                {b.name}
              </option>
            ))}

          </select>

        </div>

        {selectedBusiness && prefillData && (

          <BusinessWizard
            key={selectedBusiness}
            mode="user-update"
            initialData={prefillData}
            onSubmit={async (wizardData) => {
        
              setMsg("");
              setTicket("");
        
              setLoading(true);
        
              try {
        
                const fd = new FormData();
        
                fd.append("request_type", "update");
        
                fd.append(
                  "business_id",
                  selectedBusiness
                );
        
                Object.entries(wizardData).forEach(([k, v]) => {
        
                  if (
                    k === "gallery_files" &&
                    Array.isArray(v)
                  ) {
                    v.forEach((file) => {
                      fd.append("gallery_files", file);
                    });
        
                    return;
                  }
        
                  if (
                    k === "logo_file" ||
                    k === "cover_file"
                  ) {
                    if (v) fd.append(k, v);
                    return;
                  }
        
                  if (Array.isArray(v)) {
                    fd.append(k, JSON.stringify(v));
                    return;
                  }
        
                  if (
                    typeof v === "object" &&
                    v !== null
                  ) {
                    fd.append(k, JSON.stringify(v));
                    return;
                  }
        
                  if (
                    v !== null &&
                    v !== undefined
                  ) {
                    fd.append(k, v);
                  }
        
                });
        
                const res = await apiClient.post(
                  "/requests",
                  fd,
                  {
                    headers: {
                      "Content-Type":
                        "multipart/form-data",
                    },
                    withCredentials: true,
                  }
                );
        
                setMsg(
                  "✅ Business update request submitted."
                );
        
                setTicket(
                  res.data?.ticket_code || ""
                );
        
              } catch (err) {
        
                console.error(err);
        
                setMsg(
                  err.response?.data?.error ||
                  "Error submitting request."
                );
        
              } finally {
                setLoading(false);
              }
        
            }}
          />
        
        )}
      </div>

    </div>

  </main>

</AccountLayout>


);
}
