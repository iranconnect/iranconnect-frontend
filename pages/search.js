// frontend/pages/search.js
import { useEffect, useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import BusinessCard from '../components/BusinessCard';
import apiClient from '../utils/apiClient.js';
import { useRouter } from "next/router";

export default function SearchPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  // 🔵 جلوگیری از ورود مستقیم بدون دیدن intro
  useEffect(() => {
    const ok = localStorage.getItem("hasVisitedIntro");

    if (!ok) {
      router.replace("/intro");
      return;
    }

    setAllowed(true);
  }, []);

  if (!allowed) return null;

  return <Home />;
}

/* ============================================================================
   🔵 صفحه اصلی سرچ (بدون تغییر منطق)
   ============================================================================ */
function Home() {
  const router = useRouter();

  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [theme, setTheme] = useState('light');

    function getUrlValue(key) {
      const value = router.query[key];
  
      return typeof value === "string"
        ? value
        : "";
    }
  
    function buildSearchUrlQuery(
      nextFilters,
      loadedPage = 1
    ) {
      const query = {
        page: String(Math.max(1, loadedPage)),
      };
  
      if (nextFilters.country) {
        query.country = nextFilters.country;
      }
  
      if (nextFilters.city) {
        query.city = nextFilters.city;
      }
  
      if (nextFilters.category) {
        query.category = nextFilters.category;
      }
  
      if (nextFilters.subcategory) {
        query.subcategory = nextFilters.subcategory;
      }
  
      if (nextFilters.q) {
        query.q = nextFilters.q;
      }
  
      return query;
    }
  
    async function syncSearchUrl(
      nextFilters,
      loadedPage = 1
    ) {
      await router.replace(
        {
          pathname: "/search",
          query: buildSearchUrlQuery(
            nextFilters,
            loadedPage
          ),
        },
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    }
  
    useEffect(() => {
      if (!router.isReady) {
        return;
      }
  
      let cancelled = false;
  
      async function initializeSearchPage() {
        const initialFilters = {
          country: getUrlValue("country"),
          city: getUrlValue("city"),
          category: getUrlValue("category"),
          subcategory: getUrlValue("subcategory"),
          q: getUrlValue("q"),
        };
  
        const rawPage = Number.parseInt(
          getUrlValue("page"),
          10
        );
  
        const requestedPage =
          Number.isInteger(rawPage) && rawPage > 0
            ? rawPage
            : 1;
  
        setCountry(initialFilters.country);
        setCity(initialFilters.city);
        setCategory(initialFilters.category);
        setSubcategory(initialFilters.subcategory);
        setQ(initialFilters.q);
  
        await Promise.all([
          fetchCountries(),
          fetchCities(),
          fetchCategories(),
          fetchSubcategories(),
        ]);
        
        if (cancelled) {
          return;
        }
  
        const firstPageResult = await fetchList(
          null,
          initialFilters,
          {
            append: false,
            requestedPage: 1,
            syncUrl: false,
          }
        );
  
        if (
          !firstPageResult ||
          requestedPage <= 1
        ) {
          return;
        }
  
        for (
          let nextPage = 2;
          nextPage <= requestedPage;
          nextPage += 1
        ) {
          if (cancelled) {
            return;
          }
  
          const nextPageResult = await fetchList(
            null,
            initialFilters,
            {
              append: true,
              requestedPage: nextPage,
              syncUrl: false,
            }
          );
  
          if (
            !nextPageResult ||
            nextPageResult.page !== nextPage
          ) {
            break;
          }
        }
      }
  
      initializeSearchPage();
  
      const current =
        document.documentElement.getAttribute(
          "data-theme"
        ) || "light";
  
      setTheme(current);
  
      const observer = new MutationObserver(() => {
        const newTheme =
          document.documentElement.getAttribute(
            "data-theme"
          );
  
        setTheme(newTheme);
      });
  
      observer.observe(
        document.documentElement,
        {
          attributes: true,
          attributeFilter: ["data-theme"],
        }
      );
  
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }, [router.isReady]);

  async function fetchCountries() {
    try {
      const res = await apiClient.get(`/businesses/countries`);
      setCountries(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCities() {
    setLoadingCities(true);
  
    try {
      const res = await apiClient.get(
        "/businesses/cities"
      );
  
      setCities(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await apiClient.get(
        "/businesses/categories"
      );
  
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSubcategories() {
    try {
      const res = await apiClient.get(
        "/businesses/subcategories"
      );
  
      setSubcategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchList(
    forceCategory = null,
    filterOverrides = {},
    options = {}
  ) {
    const {
      append = false,
      requestedPage = 1,
      syncUrl = false,
    } = options;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const resolvedCountry =
        filterOverrides.country ?? country;

      const resolvedCity =
        filterOverrides.city ?? city;

      const resolvedCategory =
        filterOverrides.category ??
        forceCategory ??
        category;

      const resolvedSubcategory =
        filterOverrides.subcategory ??
        subcategory;

      const resolvedQuery =
        filterOverrides.q ?? q;

      const resolvedFilters = {
        country: resolvedCountry,
        city: resolvedCity,
        category: resolvedCategory,
        subcategory: resolvedSubcategory,
        q: resolvedQuery,
      };

      const params = {
        page: requestedPage,
        limit: 10,
      };

      if (resolvedCountry) {
        params.country = resolvedCountry;
      }

      if (resolvedCity) {
        params.city = resolvedCity;
      }

      if (resolvedCategory) {
        params.category = resolvedCategory;
      }

      if (resolvedSubcategory) {
        params.subcategory = resolvedSubcategory;
      }

      if (String(resolvedQuery).trim()) {
        params.q = String(
          resolvedQuery
        ).trim();
      }

      const res = await apiClient.get(
        "/businesses",
        { params }
      );

      const nextRows = res.data?.rows || [];
      const nextPagination =
        res.data?.pagination || {};

      const receivedPage =
        Number(nextPagination.page) ||
        requestedPage;

      setBusinesses((currentRows) =>
        append
          ? [...currentRows, ...nextRows]
          : nextRows
      );

      setCurrentPage(receivedPage);

      setHasMore(
        Boolean(nextPagination.hasNextPage)
      );

      if (syncUrl) {
        await syncSearchUrl(
          resolvedFilters,
          receivedPage
        );
      }

      return {
        page: receivedPage,
        hasMore: Boolean(
          nextPagination.hasNextPage
        ),
      };
    } catch (err) {
      console.error("Search list error:", err);

      if (!append) {
        setBusinesses([]);
        setCurrentPage(1);
        setHasMore(false);
      }

      return null;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    fetchList(
      null,
      {},
      {
        append: true,
        requestedPage: currentPage + 1,
        syncUrl: true,
      }
    );
  }

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  const handleCityChange = (event) => {
    setCity(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handleSearch = (event) => {
    event?.preventDefault?.();

    fetchList(
      null,
      {},
      {
        append: false,
        requestedPage: 1,
        syncUrl: true,
      }
    );
  };

  const selectClass = 'input-default w-full h-11';

  return (
    <div className="flex flex-col min-h-screen bg-white transition-colors">
      <Header />
  
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="mx-auto w-full max-w-5xl">
  
          {/* Filters */}
          <section className="mb-8 md:mb-10">
            <div
              className="
                rounded-2xl
                border border-[var(--border)]
                bg-[var(--card-bg)]
                shadow-[6px_6px_16px_var(--shadow-dark),-6px_-6px_16px_var(--shadow-light)]
                p-4 md:p-5
              "
            >
              <form
                onSubmit={handleSearch}
                className="
                  grid grid-cols-1 gap-4 w-full
                  sm:grid-cols-4 sm:grid-rows-2 sm:gap-4
                "
              >
  
                {/* Country */}
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
  
                {/* City */}
                <select
                  className={selectClass}
                  value={city}
                  onChange={handleCityChange}
                  disabled={loadingCities}
                >
                  <option value="">
                    {loadingCities ? 'Loading cities...' : 'City'}
                  </option>
  
                  {cities.map((ct, idx) => (
                    <option key={idx} value={ct.city}>
                      {ct.city}
                    </option>
                  ))}
                </select>
  
                {/* Category */}
                <select
                  className={selectClass}
                  value={category}
                  onChange={handleCategoryChange}
                >
                  <option value="">Category</option>
  
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
  
                {/* Subcategory */}
                <select
                  className={selectClass}
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">Subcategory</option>
  
                  {subcategories.map((sub, idx) => (
                    <option key={idx} value={sub.sub_category}>
                      {sub.sub_category}
                    </option>
                  ))}
                </select>
  
                {/* Search input */}
                <input
                  className="
                    input-default w-full h-11
                    sm:col-span-3 sm:row-start-2
                  "
                  placeholder="Search by name or address"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
  
                {/* Search button */}
                <button
                  className="
                    btn-primary w-full h-11
                    sm:col-span-1 sm:row-start-2
                  "
                  type="submit"
                >
                  Search
                </button>
  
              </form>
            </div>
          </section>
  
          {/* Results */}
          <section>
            {loading ? (
              <p>Loading...</p>
            ) : businesses.length === 0 ? (
              <p className="text-muted">
                No results found.
              </p>
            ) : (
              <div className="space-y-5">
                {businesses.map((b) => (
                  <BusinessCard
                    key={b.id}
                    b={b}
                  />
                ))}
          
                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="
                        btn-primary
                        min-w-[180px]
                        disabled:opacity-60
                      "
                    >
                      {loadingMore
                        ? "Loading..."
                        : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
  
        </div>
      </main>
  
      <Footer />
    </div>
  );
} 
