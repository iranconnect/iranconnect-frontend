/*frontend/pages/account/update-business.js*/
'use client';

import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

export default function UpdateBusinessRequest() {

const [businesses, setBusinesses] = useState([]);
const [selectedBusiness, setSelectedBusiness] = useState("");

const [form, setForm] = useState({
name: "",
short_description: "",
full_description: "",
});

const [theme, setTheme] = useState("light");

const [loading, setLoading] = useState(false);
const [msg, setMsg] = useState("");
const [ticket, setTicket] = useState("");

const [confirm, setConfirm] = useState(false);

const [logoFile, setLogoFile] = useState(null);
const [coverFile, setCoverFile] = useState(null);
const [galleryFiles, setGalleryFiles] = useState([]);

/* ============================================================
THEME
============================================================ */

useEffect(() => {

```
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
```

}, []);

/* ============================================================
LOAD OWNED BUSINESSES
============================================================ */

useEffect(() => {

```
apiClient
  .get("/requests/owned-businesses")
  .then((res) => {
    setBusinesses(res.data || []);
  })
  .catch(() => {
    setBusinesses([]);
  });
```

}, []);

/* ============================================================
LOAD BUSINESS PREFILL
============================================================ */

useEffect(() => {

```
if (!selectedBusiness) return;

async function loadBusiness() {

  try {

    const res = await apiClient.get(
      `/requests/business-prefill/${selectedBusiness}`
    );

    const data = res.data;

    setForm({
      name: data.name || "",
      short_description: data.short_description || "",
      full_description: data.full_description || "",
    });

  } catch (err) {
    console.error(err);
  }
}

loadBusiness();
```

}, [selectedBusiness]);

/* ============================================================
HELPERS
============================================================ */

const handleChange = (e) => {

```
const { name, value } = e.target;

setForm((prev) => ({
  ...prev,
  [name]: value,
}));
```

};

/* ============================================================
SUBMIT
============================================================ */

const handleSubmit = async (e) => {

```
e.preventDefault();

setMsg("");
setTicket("");

if (!selectedBusiness) {
  return setMsg("Please select a business.");
}

if (!confirm) {
  return setMsg("Please confirm your changes.");
}

setLoading(true);

try {

  const fd = new FormData();

  fd.append("request_type", "update");

  fd.append("business_id", selectedBusiness);

  fd.append(
    "payload",
    JSON.stringify(form)
  );

  if (logoFile) {
    fd.append("logo_file", logoFile);
  }

  if (coverFile) {
    fd.append("cover_file", coverFile);
  }

  galleryFiles.forEach((file) => {
    fd.append("gallery_files", file);
  });

  const res = await apiClient.post(
    "/requests",
    fd,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  );

  setMsg("✅ Business update request submitted.");

  setTicket(
    res.data?.ticket_code || ""
  );

} catch (err) {

  console.error(err);

  setMsg(
    err.response?.data?.error ||
    "Error submitting request."
  );
}

setLoading(false);
```

};

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

```
boxShadow:
  theme === "dark"
    ? "10px 10px 25px rgba(0,0,0,0.4), -10px -10px 25px rgba(255,255,255,0.05)"
    : "6px 6px 15px rgba(0,0,0,0.1), -6px -6px 15px rgba(255,255,255,0.4)",
```

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

```
  <main className="flex-1 px-4 py-6 md:py-8">

    <div className="mx-auto w-full max-w-5xl">

      <h2
        className="text-2xl font-semibold text-center mb-6"
        style={{ color: "#0A1D37" }}
      >
        Update Business Request
      </h2>

      <form onSubmit={handleSubmit}>

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

        {selectedBusiness && (
          <>

            <div style={sectionStyle}>

              <h3 className="font-semibold mb-4">
                Basic Information
              </h3>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Business name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                />

              </div>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Short description
                </label>

                <textarea
                  name="short_description"
                  value={form.short_description}
                  onChange={handleChange}
                  className={inputClass}
                />

              </div>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Full description
                </label>

                <textarea
                  name="full_description"
                  value={form.full_description}
                  onChange={handleChange}
                  className={inputClass}
                />

              </div>

            </div>

            <div style={sectionStyle}>

              <h3 className="font-semibold mb-4">
                Media
              </h3>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Replace logo
                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    setLogoFile(e.target.files[0])
                  }
                />

              </div>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Replace cover
                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    setCoverFile(e.target.files[0])
                  }
                />

              </div>

              <div className="mb-4">

                <label className="block text-sm font-medium mb-1">
                  Add gallery images
                </label>

                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setGalleryFiles(
                      Array.from(e.target.files)
                    )
                  }
                />

              </div>

            </div>

            <div style={sectionStyle}>

              <label className="flex items-center gap-2 text-sm">

                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) =>
                    setConfirm(e.target.checked)
                  }
                />

                I confirm that the information is accurate.

              </label>

            </div>

            <div style={sectionStyle}>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-turquoise py-3 rounded-lg font-medium hover:bg-turquoise/90 transition-all"
                style={{ color: "#0b2149" }}
              >
                {loading
                  ? "Submitting..."
                  : "Submit Update Request"}
              </button>

              {msg && (
                <p className="text-center text-sm mt-3">

                  {msg}

                  {ticket && (
                    <span className="block font-semibold text-turquoise mt-1">
                      Ticket: {ticket}
                    </span>
                  )}

                </p>
              )}

            </div>

          </>
        )}

      </form>

    </div>

  </main>

</AccountLayout>
```

);
}
