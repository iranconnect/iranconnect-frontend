//frontend/components/home/SearchFilters.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import apiClient from "../../utils/apiClient";

export default function SearchFilters() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    try {
      const res = await apiClient.get("/businesses/countries");
      setCountries(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCities(selectedCountry) {
    if (!selectedCountry) {
      setCities([]);
      setCity("");
      return;
    }

    setLoadingCities(true);

    try {
      const res = await apiClient.get("/businesses/cities", {
        params: { country: selectedCountry },
      });

      setCities(res.data || []);
      setCity("");
      setCategories([]);
      setCategory("");
      setSubcategories([]);
      setSubcategory("");

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  }

  async function fetchCategories(selectedCountry, selectedCity) {
    if (!selectedCountry || !selectedCity) {
      setCategories([]);
      return;
    }

    try {
      const res = await apiClient.get("/businesses/categories", {
        params: {
          country: selectedCountry,
          city: selectedCity,
        },
      });

      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSubcategories(
    selectedCountry,
    selectedCity,
    selectedCategory
  ) {
    if (
      !selectedCountry ||
      !selectedCity ||
      !selectedCategory
    ) {
      setSubcategories([]);
      return;
    }

    try {
      const res = await apiClient.get("/businesses/subcategories", {
        params: {
          country: selectedCountry,
          city: selectedCity,
          category: selectedCategory,
        },
      });

      setSubcategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCountryChange = async (e) => {
    const value = e.target.value;
    setCountry(value);
    await fetchCities(value);
  };

  const handleCityChange = async (e) => {
    const value = e.target.value;
    setCity(value);
    setCategory("");
    setSubcategory("");
    await fetchCategories(country, value);
  };

  const handleCategoryChange = async (e) => {
    const selected = e.target.value;
    setCategory(selected);
    setSubcategory("");
    await fetchSubcategories(country, city, selected);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    if (q) params.set("q", q);

    router.push(`/search?${params.toString()}`);
  };

  const selectClass = "input-default w-full h-11";

  return (
    <form
      onSubmit={handleSearch}
      className="
        mt-8
        grid grid-cols-1
        gap-4
        sm:grid-cols-4
      "
    >
      <select
        className={selectClass}
        value={country}
        onChange={handleCountryChange}
      >
        <option value="">Country</option>

        {countries.map((c, idx) => (
          <option key={idx} value={c.country}>
            {c.country}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={city}
        onChange={handleCityChange}
        disabled={!country || loadingCities}
      >
        <option value="">
          {loadingCities ? "Loading..." : "City"}
        </option>

        {cities.map((ct, idx) => (
          <option key={idx} value={ct.city}>
            {ct.city}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={category}
        onChange={handleCategoryChange}
        disabled={!city}
      >
        <option value="">Category</option>

        {categories.map((cat, idx) => (
          <option key={idx} value={cat.category}>
            {cat.category}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={subcategory}
        onChange={(e) => setSubcategory(e.target.value)}
        disabled={!category}
      >
        <option value="">Subcategory</option>

        {subcategories.map((sub, idx) => (
          <option key={idx} value={sub.sub_category}>
            {sub.sub_category}
          </option>
        ))}
      </select>

      <input
        className="
          input-default
          w-full h-11
          sm:col-span-3
        "
        placeholder="Search by name or address"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <button
        type="submit"
        className="
          btn-primary
          h-11
          sm:col-span-1
        "
      >
        Search
      </button>
    </form>
  );
}
