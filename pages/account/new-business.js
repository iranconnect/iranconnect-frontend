//frontend/pages/account/new-business.js
'use client';
import { useState, useEffect } from "react";
import AccountLayout from "../../components/account/AccountLayout";
import apiClient from "../../utils/apiClient";

export default function NewBusinessRequest() {

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [services, setServices] = useState([]);
  const [tags, setTags] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    subcategory_ids: [],

    legal_name: "",
    business_type: "",
    year_established: "",

    short_description: "",
    full_description: "",

    services: [],
    tags: [],

    service_mode: "",
    availability_type: "",
    availability_note: "",

    country: "",
    city: "",
    address: "",
    postal_code: "",
    location_map_url: "",

    phone: "",
    email: "",
    website: "",

    is_public: true,
    allow_reviews: true,
  });

  const [errors, setErrors] = useState({});
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [buildingImage, setBuildingImage] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================================
     LOAD DATA (مثل ادمین)
  ================================= */
  useEffect(() => {
    apiClient.get("/admin/categories/all")
      .then(res => setCategories(res.data?.data || []));
  }, []);

  useEffect(() => {
    if (!form.category_id) return;

    apiClient.get("/admin/subcategories", {
      params: { category_id: form.category_id }
    }).then(res => setSubcategories(res.data?.data || []));
  }, [form.category_id]);

  useEffect(() => {
    if (!form.subcategory_ids.length) return;

    apiClient.get("/admin/services", {
      params: { subcategory_ids: form.subcategory_ids }
    }).then(res => setServices(res.data?.data || []));
  }, [form.subcategory_ids]);

  useEffect(() => {
    apiClient.get("/admin/tags/for-business")
      .then(res => setTags(res.data?.data || []));
  }, []);

  /* ================================
     HANDLERS
  ================================= */
  function setField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function toggleArray(field, id) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(x => x !== id)
        : [...prev[field], id]
    }));
  }

  /* ================================
     VALIDATION
  ================================= */
  function validate() {
    let err = {};

    if (!form.name || form.name.length < 3)
      err.name = "Minimum 3 characters";

    if (!form.category_id)
      err.category = "Required";

    if (!form.subcategory_ids.length)
      err.subcategory = "Select at least one";

    if (!form.short_description || form.short_description.length < 20)
      err.short_description = "Min 20 chars";

    if (!form.full_description || form.full_description.length < 50)
      err.full_description = "Min 50 chars";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = "Invalid email";

    if (form.website && !/^https?:\/\//.test(form.website))
      err.website = "Must start with https://";

    if (form.location_map_url && !form.location_map_url.includes("maps"))
      err.map = "Invalid Google Maps link";

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  /* ================================
     SUBMIT (بدون تغییر)
  ================================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(""); setTicket("");

    if (!validate()) return setMsg("Fix errors");
    if (!confirm) return setMsg("Confirm data");
    if (!ownershipDoc || !buildingImage)
      return setMsg("Upload files");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("request_type", "new");
      fd.append("payload", JSON.stringify(form));
      fd.append("files", ownershipDoc);
      fd.append("files", buildingImage);

      const res = await apiClient.post("/requests", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setMsg("✅ Submitted!");
      setTicket(res.data.ticket_code);

    } catch (err) {
      setMsg("Error submitting");
    }

    setLoading(false);
  }

  /* ================================
     UI
  ================================= */
  const input = "w-full p-3 rounded border mb-3";

  return (
    <AccountLayout>
      <main className="p-6 flex justify-center">
        <div className="w-full max-w-xl p-6 bg-white rounded">

          <h2 className="text-xl mb-6">Add Business</h2>

          <form onSubmit={handleSubmit}>

            {/* BASIC */}
            <section className="mb-6">
              <h3 className="font-semibold mb-3">Basic</h3>
              <input className={input} placeholder="Name" onChange={e=>setField("name",e.target.value)} />
              <input className={input} placeholder="Legal name" onChange={e=>setField("legal_name",e.target.value)} />
            </section>

            {/* CATEGORY */}
            <section className="mb-6">
              <h3 className="font-semibold mb-3">Category</h3>

              <select className={input} onChange={e=>setField("category_id",Number(e.target.value))}>
                <option>Select</option>
                {categories.map(c=>(
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {subcategories.map(s=>(
                <label key={s.id} className="block">
                  <input type="checkbox"
                    onChange={()=>toggleArray("subcategory_ids",s.id)} />
                  {s.name}
                </label>
              ))}
            </section>

            {/* DESCRIPTION */}
            <section className="mb-6">
              <h3 className="font-semibold mb-3">Description</h3>

              <textarea className={input}
                maxLength={160}
                placeholder="Short (20-160 chars)"
                onChange={e=>setField("short_description",e.target.value)} />

              <small>{form.short_description.length}/160</small>

              <textarea className={input}
                placeholder="Full (min 50 chars)"
                onChange={e=>setField("full_description",e.target.value)} />
            </section>

            {/* SERVICES */}
            <section className="mb-6">
              <h3 className="font-semibold mb-3">Services</h3>

              {services.map(s=>(
                <label key={s.id} className="block">
                  <input type="checkbox"
                    onChange={()=>toggleArray("services",s.id)} />
                  {s.name}
                </label>
              ))}
            </section>

            {/* TAGS */}
            <section className="mb-6">
              <h3 className="font-semibold mb-3">Tags</h3>

              {tags.map(t=>(
                <label key={t.id} className="inline-block mr-3">
                  <input type="checkbox"
                    onChange={()=>toggleArray("tags",t.id)} />
                  {t.name}
                </label>
              ))}
            </section>

            {/* FILES */}
            <section className="mb-6">
              <input type="file" onChange={e=>setOwnershipDoc(e.target.files[0])} required />
              <input type="file" onChange={e=>setBuildingImage(e.target.files[0])} required />
            </section>

            <label>
              <input type="checkbox" onChange={e=>setConfirm(e.target.checked)} />
              Confirm
            </label>

            <button disabled={loading} className="w-full mt-4 bg-blue-500 text-white p-3">
              Submit
            </button>

            {msg && <p>{msg}</p>}
            {ticket && <p>{ticket}</p>}

          </form>
        </div>
      </main>
    </AccountLayout>
  );
}
