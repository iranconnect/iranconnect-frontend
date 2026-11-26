// frontend/pages/search.js
import { useEffect, useRef, useState } from "react";
import Header from '../components/Header';
import SiteHead from "../components/SiteHead";
import Footer from '../components/Footer';
import BusinessCard from '../components/BusinessCard';
import RevealOnScroll from '../components/ui/RevealOnScroll';
import ScrollToTopButton from '../components/ui/ScrollToTopButton';
import PageLoadingOverlay from '../components/ui/PageLoadingOverlay';
import apiClient from '../utils/apiClient.js';
import { useRouter } from "next/router";

import { Country } from "country-state-city";

const SEARCH_QUERY_MAX_LENGTH = 100;
const SEARCH_LIST_TIMEOUT_MS = 15000;
const SEARCH_SORT_DEBOUNCE_MS = 500;
const DEFAULT_SEARCH_SORT = "newest";

const SEARCH_SORT_OPTIONS = [
  "newest",
  "oldest",
  "verified",
  "highest_rated",
  "most_reviewed",
  "name_asc",
  "name_desc",
];

const SEARCH_SORT_LABELS = {
  en: [
    "Sort by",
    "Newest first",
    "Oldest first",
    "Verified first",
    "Highest rated",
    "Most reviewed",
    "Name A–Z",
    "Name Z–A",
  ],
  fr: [
    "Trier par",
    "Plus récents",
    "Plus anciens",
    "Vérifiés en priorité",
    "Mieux notés",
    "Plus d’avis",
    "Nom A–Z",
    "Nom Z–A",
  ],
  fa: [
    "مرتب‌سازی بر اساس",
    "جدیدترین‌ها",
    "قدیمی‌ترین‌ها",
    "تأییدشده‌ها در اولویت",
    "بالاترین امتیاز",
    "بیشترین تعداد نظرات",
    "نام، صعودی",
    "نام، نزولی",
  ],
};

function normalizeSearchSort(value) {
  return typeof value === "string" &&
    SEARCH_SORT_OPTIONS.includes(value)
    ? value
    : DEFAULT_SEARCH_SORT;
}

const SEARCH_KEYS = [
  "country", "city", "category", "subcategory", "q", "page", "sort"
];

function searchUrlKey(query) {
  return JSON.stringify(
    SEARCH_KEYS.map((key) => query[key] ?? null)
  );
}

const FEATURED_CATEGORY_NAMES = {
  "health-medical": "Health & Medical",
  "legal-immigration": "Legal & Immigration Services",
  "translation-language-services": "Translation & Language Services",
};
export default function SearchPage() {
  return <Home />;
}

/* ============================================================================
   🔵 صفحه اصلی سرچ (بدون تغییر منطق)
   ============================================================================ */
function Home() {
  const router = useRouter();
  const userInteractedRef = useRef(false);
  const searchRequestVersionRef = useRef(0);
  const activeListRequestRef = useRef(null);
  const manualSearchIssuedRef = useRef(false);

  const cityRequestVersionRef = useRef(0);
  const appliedFiltersRef = useRef(null);
  const sortingTimerRef = useRef(null);
  const sortingBusyRef = useRef(false);
  const selectedSortRef = useRef(DEFAULT_SEARCH_SORT);
  const internalUrlRef = useRef(null);
  const loadMoreLockRef = useRef(null);
  const initializingRef = useRef(false);
  const routeKey = searchUrlKey(router.query);
  const [isInitializing, setIsInitializing] = useState(false);

  const [sort, setSort] = useState(DEFAULT_SEARCH_SORT);
  const [sortingBusy, setSortingBusy] = useState(false);
  const [sortLanguage, setSortLanguage] = useState("en");

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
  const [searchError, setSearchError] = useState("");
  const [
    isBusinessNavigating,
    setIsBusinessNavigating,
  ] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const updateLanguage = () => {
      const language = String(
        router.locale ||
        document.documentElement.lang ||
        "en"
      ).toLowerCase().split("-")[0];

      setSortLanguage(
        ["en", "fr", "fa"].includes(language)
          ? language
          : "en"
      );
    };

    updateLanguage();

    const observer = new MutationObserver(updateLanguage);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, [router.locale]);

  useEffect(() => {
    return () => {
      clearTimeout(sortingTimerRef.current);
      sortingTimerRef.current = null;
      sortingBusyRef.current = false;
      searchRequestVersionRef.current += 1;
      const active = activeListRequestRef.current;
      activeListRequestRef.current = null;
      active?.controller.abort();
    };
  }, []);

  useEffect(() => {
    function clearBusinessNavigation() {
      setIsBusinessNavigating(false);
    }

    router.events.on(
      "routeChangeComplete",
      clearBusinessNavigation
    );

    router.events.on(
      "routeChangeError",
      clearBusinessNavigation
    );

    return () => {
      router.events.off(
        "routeChangeComplete",
        clearBusinessNavigation
      );

      router.events.off(
        "routeChangeError",
        clearBusinessNavigation
      );
    };
  }, [router.events]);

    function getUrlValue(key) {
      const value = router.query[key];
  
      return typeof value === "string"
        ? value
        : "";
    }
  
    async function getApproximateLocation() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      try {
        const response = await fetch("/api/geo", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    }


    function buildSearchUrlQuery(
      nextFilters,
      loadedPage = 1,
      explicitLocation = true
    ) {
      const query = {
        page: String(Math.max(1, loadedPage)),
        sort: normalizeSearchSort(
          nextFilters.sort ?? selectedSortRef.current
        ),
      };

      if (nextFilters.country || explicitLocation) {
        query.country = nextFilters.country || "";
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
      loadedPage = 1,
      explicitLocation = true
    ) {
      const query = buildSearchUrlQuery(
        nextFilters,
        loadedPage,
        explicitLocation
      );

      const targetKey = searchUrlKey(query);

      if (targetKey === routeKey) return;

      internalUrlRef.current = targetKey;

      try {
        const changed = await router.replace(
          { pathname: "/search", query },
          undefined,
          { shallow: true, scroll: false }
        );

        if (
          changed === false &&
          internalUrlRef.current === targetKey
        ) {
          internalUrlRef.current = null;
        }
      } catch (err) {
        if (internalUrlRef.current === targetKey) {
          internalUrlRef.current = null;
        }
        console.error("Search URL synchronization error:", err);
      }
    }
  

    useEffect(() => {
      if (!router.isReady) return;

      if (internalUrlRef.current === routeKey) {
        internalUrlRef.current = null;
        return;
      }

      internalUrlRef.current = null;

      cancelPendingSorting();

      let cancelled = false;
      const version = ++searchRequestVersionRef.current;

      cancelActiveListRequest();
      setSearchError("");

      userInteractedRef.current = false;
      manualSearchIssuedRef.current = false;
      loadMoreLockRef.current = null;
      appliedFiltersRef.current = null;
      initializingRef.current = true;

      setIsInitializing(true);
      setLoading(true);
      setLoadingMore(false);
      setHasMore(false);

      const isCurrent = () =>
        !cancelled &&
        version === searchRequestVersionRef.current;

      async function initializeSearchPage() {
        const initialFilters = {
          country: getUrlValue("country"),
          city: getUrlValue("city"),
          category: getUrlValue("category"),
          subcategory: getUrlValue("subcategory"),
          q: getUrlValue("q"),
          sort: normalizeSearchSort(router.query.sort),
        };

        selectedSortRef.current = initialFilters.sort;
        setSort(initialFilters.sort);

        const rawPageValue = getUrlValue("page");
        const rawPage = Number(rawPageValue);
        const requestedPage =
          Number.isSafeInteger(rawPage) && rawPage > 0
            ? rawPage
            : 1;

        const hasExplicitLocation =
          Object.prototype.hasOwnProperty.call(router.query, "country") ||
          Object.prototype.hasOwnProperty.call(router.query, "city");

        setCountry(initialFilters.country);
        setCity(initialFilters.city);
        setCategory(initialFilters.category);
        setSubcategory(initialFilters.subcategory);
        setQ(initialFilters.q);

        const [countryRows, initialCityRows] = await Promise.all([
          fetchCountries(),
          fetchCities(initialFilters.country),
          fetchCategories(),
          fetchSubcategories(),
        ]);

        if (!isCurrent()) return;

        const loadInitialIfInteracted = async () => {
          if (!userInteractedRef.current) return false;

          if (isCurrent() && !manualSearchIssuedRef.current) {
            await fetchList(null, initialFilters, {
              requestedPage: 1,
              syncUrl: false,
            });
          }

          return true;
        };

        if (await loadInitialIfInteracted()) return;

        let effectiveFilters = { ...initialFilters };
        let optionsCountry = initialFilters.country;
        let resolvedCityOptions = null;
        let autoLocation = false;

        if (hasExplicitLocation) {
          const matchedCountry = (countryRows || []).find(
            (item) =>
              String(item.country).toLowerCase() ===
              initialFilters.country.toLowerCase()
          );

          if (matchedCountry) {
            effectiveFilters.country = matchedCountry.country;
          }

          let locationCities = initialCityRows || [];

          if (effectiveFilters.country !== optionsCountry) {
            const rows = await readCityOptions(
              effectiveFilters.country
            );

            locationCities = rows || [];

            resolvedCityOptions = {
              country: effectiveFilters.country,
              rows,
            };
          }

          if (!isCurrent()) return;
          if (await loadInitialIfInteracted()) return;

          const matchedCity = locationCities.find(
            (item) =>
              String(item.city).toLowerCase() ===
              initialFilters.city.toLowerCase()
          );

          if (matchedCity) {
            effectiveFilters.city = matchedCity.city;
          }
        } else {
          const geo = await getApproximateLocation();

          if (!isCurrent()) return;
          if (await loadInitialIfInteracted()) return;

          const countryName =
            geo &&
            typeof geo.countryCode === "string" &&
            /^[A-Z]{2}$/.test(geo.countryCode)
              ? Country.getCountryByCode(geo.countryCode)?.name
              : null;

          const matchedCountry = (countryRows || []).find(
            (item) =>
              String(item.country).toLowerCase() ===
              String(countryName || "").toLowerCase()
          );

          if (matchedCountry) {
            effectiveFilters.country = matchedCountry.country;
            autoLocation = true;

            const rows = await readCityOptions(
              matchedCountry.country
            );

            const localCities = rows || [];

            resolvedCityOptions = {
              country: matchedCountry.country,
              rows,
            };

            if (!isCurrent()) return;
            if (await loadInitialIfInteracted()) return;

            const matchedCity = localCities.find(
              (item) =>
                typeof geo.city === "string" &&
                String(item.city).trim().toLowerCase() ===
                geo.city.trim().toLowerCase()
            );

            if (matchedCity) {
              effectiveFilters.city = matchedCity.city;
            }
          }
        }

        const candidates = [effectiveFilters];

        if (autoLocation && effectiveFilters.city) {
          candidates.push({
            ...effectiveFilters,
            city: "",
          });
        }

        if (autoLocation) {
          candidates.push({
            ...effectiveFilters,
            country: "",
            city: "",
          });
        }

        let pageResult = null;
        let loadedPage = 1;

        for (const candidate of candidates) {
          if (!isCurrent() || userInteractedRef.current) return;

          effectiveFilters = candidate;

          setCountry(candidate.country);
          setCity(candidate.city);
          setCategory(candidate.category);
          setSubcategory(candidate.subcategory);
          setQ(candidate.q);

          if (candidate.country !== optionsCountry) {
            if (
              resolvedCityOptions?.country === candidate.country &&
              Array.isArray(resolvedCityOptions.rows)
            ) {
              cityRequestVersionRef.current += 1;
              setCities(resolvedCityOptions.rows);
              setLoadingCities(false);
            } else {
              fetchCities(candidate.country);
            }

            optionsCountry = candidate.country;
          }

          pageResult = await fetchList(null, candidate, {
            requestedPage: 1,
            syncUrl: false,
          });

          if (!isCurrent() || userInteractedRef.current) return;

          if (
            !pageResult ||
            pageResult.rowCount > 0 ||
            !autoLocation
          ) {
            break;
          }
        }

        if (!pageResult) return;

        loadedPage = pageResult.page;
        let exhausted = !pageResult.hasMore;

        while (
          loadedPage < requestedPage &&
          pageResult.hasMore
        ) {
          if (!isCurrent() || userInteractedRef.current) return;

          const nextPage = loadedPage + 1;

          const nextResult = await fetchList(
            null,
            effectiveFilters,
            {
              append: true,
              requestedPage: nextPage,
              syncUrl: false,
            }
          );

          if (!isCurrent()) return;

          if (!nextResult) return;

          if (nextResult.rejected || nextResult.page !== nextPage) {
            exhausted = true;
            break;
          }

          pageResult = nextResult;
          loadedPage = nextResult.page;
          exhausted = !nextResult.hasMore;
        }

        if (!isCurrent() || userInteractedRef.current) return;

        const invalidPage =
          Object.prototype.hasOwnProperty.call(router.query, "page") &&
          (
            !Number.isSafeInteger(rawPage) ||
            rawPage < 1 ||
            rawPageValue !== String(rawPage)
          );

        const locationNormalized =
          hasExplicitLocation &&
          (
            initialFilters.country !== effectiveFilters.country ||
            initialFilters.city !== effectiveFilters.city
          );

        const invalidSort =
          Object.prototype.hasOwnProperty.call(router.query, "sort") &&
          router.query.sort !== initialFilters.sort;

        if (
          invalidPage ||
          invalidSort ||
          locationNormalized ||
          (exhausted && loadedPage < requestedPage)
        ) {
          initializingRef.current = false;
          setIsInitializing(false);

          await syncSearchUrl(
            hasExplicitLocation ? effectiveFilters : initialFilters,
            loadedPage,
            hasExplicitLocation
          );
        }
      }

      initializeSearchPage()
        .catch((err) => {
          if (isCurrent()) {
            console.error("Search initialization error:", err);
          }
        })
        .finally(() => {
          if (isCurrent()) {
            initializingRef.current = false;
            setIsInitializing(false);
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;

        if (version === searchRequestVersionRef.current) {
          searchRequestVersionRef.current += 1;
          cancelActiveListRequest();
        }
      };
    }, [router.isReady, routeKey]);

    useEffect(() => {
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
        observer.disconnect();
      };
    }, []);

  async function fetchCountries() {
    try {
      const res = await apiClient.get(`/businesses/countries`);
      setCountries(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error(err);
    }
  }


  async function readCityOptions(selectedCountry = "") {
    try {
      const response = await apiClient.get(
        "/businesses/cities",
        {
          params: selectedCountry
            ? { country: selectedCountry }
            : {},
        }
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    } catch (err) {
      console.error("City options lookup error:", err);
      return null;
    }
  }

  async function fetchCities(selectedCountry = "") {
    const version = ++cityRequestVersionRef.current;

    setLoadingCities(true);
    setCities([]);

    try {
      const rows = await readCityOptions(
        selectedCountry
      );

      if (version !== cityRequestVersionRef.current) {
        return null;
      }

      setCities(rows || []);
      return rows;
    } catch (err) {
      if (version === cityRequestVersionRef.current) {
        console.error("City options error:", err);
      }
      return null;
    } finally {
      if (version === cityRequestVersionRef.current) {
        setLoadingCities(false);
      }
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

  function getListRequestKey(filters, page = 1) {
    return JSON.stringify([
      filters.country || "",
      filters.city || "",
      filters.category || "",
      filters.subcategory || "",
      String(filters.q ?? "").trim(),
      normalizeSearchSort(
        filters.sort ?? selectedSortRef.current
      ),
      page,
    ]);
  }

  function cancelActiveListRequest() {
    const active = activeListRequestRef.current;
    activeListRequestRef.current = null;
    active?.controller.abort();
  }

  function reuseActiveListRequest(filters) {
    const active = activeListRequestRef.current;

    if (
      !active ||
      active.controller.signal.aborted ||
      active.version !== searchRequestVersionRef.current ||
      active.key !== getListRequestKey(filters, 1)
    ) {
      return false;
    }

    active.syncUrl = true;
    return true;
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
      preserveAppliedOnError = false,
    } = options;

    const requestVersion = searchRequestVersionRef.current;

    const resolvedFilters = {
      country: filterOverrides.country ?? country,
      city: filterOverrides.city ?? city,
      category: filterOverrides.category ?? forceCategory ?? category,
      subcategory: filterOverrides.subcategory ?? subcategory,
      q: filterOverrides.q ?? q,
      sort: normalizeSearchSort(
        filterOverrides.sort ?? selectedSortRef.current
      ),
    };

    const query = String(resolvedFilters.q ?? "").trim();
    const key = getListRequestKey(resolvedFilters, requestedPage);
    const previous = activeListRequestRef.current;

    if (
      previous &&
      previous.version === requestVersion &&
      previous.key === key &&
      !previous.controller.signal.aborted
    ) {
      if (syncUrl) previous.syncUrl = true;
      return null;
    }

    cancelActiveListRequest();

    const controller = new AbortController();

    const activeRequest = {
      controller,
      key,
      version: requestVersion,
      syncUrl,
    };

    activeListRequestRef.current = activeRequest;
    setSearchError("");

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setLoadingMore(false);
    }

    try {
      if (
        String(resolvedFilters.q ?? "").length >
        SEARCH_QUERY_MAX_LENGTH
      ) {
        const error = new Error("Search query too long");
        error.code = "SEARCH_QUERY_TOO_LONG";
        throw error;
      }

      const params = {
        page: requestedPage,
        limit: 10,
        sort: resolvedFilters.sort,
      };

      if (resolvedFilters.country) {
        params.country = resolvedFilters.country;
      }

      if (resolvedFilters.city) {
        params.city = resolvedFilters.city;
      }

      if (resolvedFilters.category) {
        params.category = resolvedFilters.category;
      }

      if (resolvedFilters.subcategory) {
        params.subcategory = resolvedFilters.subcategory;
      }

      if (query) params.q = query;

      const res = await apiClient.get(
        "/businesses",
        {
          params,
          signal: controller.signal,
          timeout: SEARCH_LIST_TIMEOUT_MS,
        }
      );

      if (
        requestVersion !== searchRequestVersionRef.current ||
        activeListRequestRef.current !== activeRequest ||
        controller.signal.aborted
      ) {
        return null;
      }

      const nextRows = res.data?.rows || [];
      const nextPagination =
        res.data?.pagination || {};

      const receivedPage =
        Number(nextPagination.page) ||
        requestedPage;


      if (append && receivedPage !== requestedPage) {
        setHasMore(false);

        return {
          rowCount: 0,
          page: receivedPage,
          hasMore: false,
          rejected: true,
        };
      }

      setBusinesses((currentRows) => {
        const combinedRows = append
          ? [...currentRows, ...nextRows]
          : nextRows;

        const seen = new Set();

        return combinedRows.filter((row) => {
          const key = String(row.id);

          if (seen.has(key)) return false;

          seen.add(key);
          return true;
        });
      });

      if (!append) {
        appliedFiltersRef.current = resolvedFilters;
      }

      setCurrentPage(receivedPage);

      const nextHasMore =
        nextRows.length > 0 &&
        Boolean(nextPagination.hasNextPage);

      setHasMore(nextHasMore);

      if (activeRequest.syncUrl) {
        await syncSearchUrl(
          resolvedFilters,
          receivedPage
        );
      }

      return {
        rowCount: nextRows.length,
        page: receivedPage,
        hasMore: nextHasMore,
      };
    } catch (err) {
      if (
        requestVersion !== searchRequestVersionRef.current ||
        activeListRequestRef.current !== activeRequest ||
        controller.signal.aborted ||
        err?.code === "ERR_CANCELED"
      ) {
        return null;
      }

      if (err?.code === "SEARCH_QUERY_TOO_LONG") {
        setSearchError(
          "Search text must not exceed 100 characters."
        );
      } else if (err?.response?.status === 429) {
        setSearchError(
          "Too many search requests. Please wait a moment and try again."
        );
      } else if (
        err?.code === "ECONNABORTED" ||
        err?.code === "ETIMEDOUT" ||
        err?.response?.status === 504
      ) {
        setSearchError(
          "The search timed out. Please try again."
        );
      } else {
        setSearchError(
          "Unable to load search results. Please try again."
        );
      }

      if (!append && !preserveAppliedOnError) {
        appliedFiltersRef.current = null;
        setBusinesses([]);
        setCurrentPage(1);
        setHasMore(false);
      }

      return null;
    } finally {
      if (activeListRequestRef.current === activeRequest) {
        activeListRequestRef.current = null;

        if (requestVersion === searchRequestVersionRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }
  }

  async function handleLoadMore() {
    if (
      sortingBusyRef.current ||
      loading ||
      loadingMore ||
      initializingRef.current ||
      loadMoreLockRef.current !== null ||
      !hasMore ||
      !appliedFiltersRef.current
    ) {
      return;
    }

    userInteractedRef.current = true;

    const version = ++searchRequestVersionRef.current;
    loadMoreLockRef.current = version;

    try {
      await fetchList(
        null,
        appliedFiltersRef.current,
        {
          append: true,
          requestedPage: currentPage + 1,
          syncUrl: true,
        }
      );
    } finally {
      if (loadMoreLockRef.current === version) {
        loadMoreLockRef.current = null;
      }
    }
  }

  const handleCountryChange = (event) => {
    userInteractedRef.current = true;

    const nextCountry = event.target.value;

    setCountry(nextCountry);
    setCity("");
    fetchCities(nextCountry);
  };

  const handleCityChange = (event) => {
    userInteractedRef.current = true;
    setCity(event.target.value);
  };

  const handleCategoryChange = (event) => {
    userInteractedRef.current = true;

    const nextCategory = event.target.value;
    setCategory(nextCategory);

    if (nextCategory && subcategory) {
      const parent = categories.find(
        (item) => item.slug === nextCategory
      );

      const compatible = parent && subcategories.some(
        (item) =>
          item.slug === subcategory &&
          String(item.category_id) === String(parent.id)
      );

      if (!compatible) {
        setSubcategory("");
      }
    }
  };

  const handleSearch = (event) => {
    event?.preventDefault?.();

    cancelPendingSorting();

    userInteractedRef.current = true;
    manualSearchIssuedRef.current = true;
    initializingRef.current = false;
    setIsInitializing(false);
    loadMoreLockRef.current = null;

    if (
      String(q ?? "").length <= SEARCH_QUERY_MAX_LENGTH &&
      reuseActiveListRequest({
        country, city, category, subcategory, q,
        sort: selectedSortRef.current,
      })
    ) {
      return;
    }

    searchRequestVersionRef.current += 1;

    fetchList(null, {}, {
      append: false,
      requestedPage: 1,
      syncUrl: true,
    });
  };

  const handleClear = (event) => {
    event?.preventDefault?.();

    cancelPendingSorting();
    selectedSortRef.current = DEFAULT_SEARCH_SORT;
    setSort(DEFAULT_SEARCH_SORT);

    userInteractedRef.current = true;
    manualSearchIssuedRef.current = true;
    initializingRef.current = false;
    setIsInitializing(false);
    loadMoreLockRef.current = null;

    const clearedFilters = {
      sort: DEFAULT_SEARCH_SORT,
      q: "",
      country: "",
      city: "",
      category: "",
      subcategory: "",
    };

    const reused = reuseActiveListRequest(clearedFilters);

    setQ("");
    setCountry("");
    setCity("");
    setCategory("");
    setSubcategory("");

    if (!reused || country) {
      fetchCities("");
    }

    if (reused) return;

    searchRequestVersionRef.current += 1;

    fetchList(null, clearedFilters, {
      append: false,
      requestedPage: 1,
      syncUrl: true,
    });
  };

  function cancelPendingSorting() {
    clearTimeout(sortingTimerRef.current);
    sortingTimerRef.current = null;
    sortingBusyRef.current = false;
    setSortingBusy(false);
  }

  function handleSortChange(event) {
    const nextSort = normalizeSearchSort(event.target.value);
    const applied = appliedFiltersRef.current;

    if (
      !applied ||
      initializingRef.current ||
      loadingMore ||
      (loading && !sortingBusyRef.current) ||
      nextSort === selectedSortRef.current
    ) {
      return;
    }

    clearTimeout(sortingTimerRef.current);
    sortingTimerRef.current = null;

    selectedSortRef.current = nextSort;
    setSort(nextSort);

    userInteractedRef.current = true;
    manualSearchIssuedRef.current = true;

    const version = ++searchRequestVersionRef.current;

    cancelActiveListRequest();
    loadMoreLockRef.current = null;
    setSearchError("");

    if (
      nextSort === normalizeSearchSort(applied.sort)
    ) {
      sortingBusyRef.current = false;
      setSortingBusy(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    sortingBusyRef.current = true;
    setSortingBusy(true);

    const nextFilters = {
      ...applied,
      sort: nextSort,
    };

    sortingTimerRef.current = setTimeout(async () => {
      sortingTimerRef.current = null;

      if (
        version !== searchRequestVersionRef.current ||
        !sortingBusyRef.current
      ) {
        return;
      }

      try {
        const result = await fetchList(null, nextFilters, {
          append: false,
          requestedPage: 1,
          syncUrl: true,
          preserveAppliedOnError: true,
        });

        if (
          !result &&
          version === searchRequestVersionRef.current
        ) {
          const lastAppliedSort = normalizeSearchSort(
            appliedFiltersRef.current?.sort ?? applied.sort
          );

          selectedSortRef.current = lastAppliedSort;
          setSort(lastAppliedSort);
        }
      } finally {
        if (version === searchRequestVersionRef.current) {
          sortingBusyRef.current = false;
          setSortingBusy(false);
        }
      }
    }, SEARCH_SORT_DEBOUNCE_MS);
  }

  const sortLabels = SEARCH_SORT_LABELS[sortLanguage];

  const selectedCategory = categories.find(
    (item) => item.slug === category
  );

  const visibleSubcategories = category
    ? selectedCategory
      ? subcategories.filter(
          (item) =>
            String(item.category_id) ===
            String(selectedCategory.id)
        )
      : []
    : subcategories;

  const selectClass = 'input-default w-full h-11';

  return (
    <div className="flex flex-col min-h-screen bg-white transition-colors">
      <SiteHead title="Search Iranian Businesses & Professionals — IranConnect" />
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

                  {country && !countries.some(
                    (item) => item.country === country
                  ) && (
                    <option value={country}>{country}</option>
                  )}

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

                  {city && !cities.some(
                    (item) => item.city === city
                  ) && (
                    <option value={city}>{city}</option>
                  )}

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

                  {category && !categories.some(
                    (item) => item.slug === category
                  ) && (
                    <option value={category}>
                      {FEATURED_CATEGORY_NAMES[category] || category}
                    </option>
                  )}

                  {categories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.slug}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
  
                {/* Subcategory */}
                <select
                  className={selectClass}
                  value={subcategory}
                  onChange={(e) => {
                    userInteractedRef.current = true;
                    setSubcategory(e.target.value);
                  }}
                >
                  <option value="">Subcategory</option>

                  {subcategory && !visibleSubcategories.some(
                    (item) => item.slug === subcategory
                  ) && (
                    <option value={subcategory} disabled>
                      {subcategories.find(
                        (item) => item.slug === subcategory
                      )?.name || subcategory} (Unavailable)
                    </option>
                  )}

                  {visibleSubcategories.map((sub) => (
                    <option
                      key={sub.id}
                      value={sub.slug}
                    >
                      {sub.name}
                    </option>
                  ))}
                </select>
  
                {/* Search input */}
                <input
                  className="
                    input-default w-full h-11
                    sm:col-span-2 sm:row-start-2
                  "
                  placeholder="Search by name or address"
                  maxLength={SEARCH_QUERY_MAX_LENGTH}
                  value={q}
                  onChange={(event) => {
                    userInteractedRef.current = true;
                    setQ(event.target.value);
                  }}
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
                
                {/* Clear button */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="
                    search-clear-btn
                    w-full
                    h-11
                    sm:col-span-1
                    sm:row-start-2
                  "
                >
                  Clear
                </button>
  
              </form>
            </div>
          </section>
  
          {/* Results */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <label
                htmlFor="search-sort"
                className="text-sm font-medium text-[var(--text)]"
              >
                {sortLabels[0]}
              </label>

              <select
                id="search-sort"
                value={sort}
                onChange={handleSortChange}
                dir={sortLanguage === "fa" ? "rtl" : "ltr"}
                disabled={
                  isInitializing ||
                  loadingMore ||
                  (loading && !sortingBusy) ||
                  !appliedFiltersRef.current
                }
                className="w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60 sm:w-auto"
              >
                {SEARCH_SORT_OPTIONS.map((value, index) => (
                  <option key={value} value={value}>
                    {sortLabels[index + 1]}
                  </option>
                ))}
              </select>
            </div>

            {searchError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]"
              >
                {searchError}
              </div>
            )}
            {loading ? (
              <p>Loading...</p>
            ) : searchError && businesses.length === 0 ? null
            : businesses.length === 0 ? (
              <div
                role="status"
                className={`
                  flex flex-col items-center
                  rounded-2xl border
                  px-5 py-12 md:py-14
                  text-center
                  ${
                    theme === "dark"
                      ? "bg-[#13294b] border-[#243e5e] text-white"
                      : "bg-slate-50 border-slate-200 text-[#13294b]"
                  }
                `}
              >
                <svg
                  aria-hidden="true"
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    theme === "dark"
                      ? "mb-4 text-[#40e0d0]"
                      : "mb-4 text-teal-700"
                  }
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m16 16 5 5" />
                  <path d="m8 8 5 5m0-5-5 5" />
                </svg>

                <p className="text-lg font-semibold">
                  No results found.
                </p>

                <p
                  className={
                    theme === "dark"
                      ? "mt-2 text-sm text-slate-300"
                      : "mt-2 text-sm text-slate-600"
                  }
                >
                  Try adjusting your search filters.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {businesses.map((b, index) => (
                  <RevealOnScroll
                    key={b.id}
                    delayMs={Math.min(
                      (index % 4) * 45,
                      135
                    )}
                  >
                    <BusinessCard
                      b={b}
                      variant="search"
                      onProfileNavigate={() =>
                        setIsBusinessNavigating(
                          true
                        )
                      }
                    />
                  </RevealOnScroll>
                ))}
          
                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore || isInitializing}
                      className="
                        btn-primary
                        w-full
                        min-h-[48px]
                        rounded-xl
                        sm:w-auto
                        sm:min-w-[200px]
                        sm:px-8
                        sm:rounded-full
                        disabled:opacity-60
                        disabled:cursor-not-allowed
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
  
      <PageLoadingOverlay
        visible={isBusinessNavigating}
      />

      <ScrollToTopButton />
      <Footer />
    </div>
  );
} 
