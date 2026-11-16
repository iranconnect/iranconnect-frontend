//iranconnect-frontend/pages/index.js
import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import popularCities from "../data/popularCities";

import Layout from "../components/Layout";

import HeroSection from "../components/home/HeroSection";
import FeaturedCategories from "../components/home/FeaturedCategories";
import PopularCities from "../components/home/PopularCities";
import FeaturedBusinesses from "../components/home/FeaturedBusinesses";
import FAQSection from "../components/home/FAQSection";
import CTASection from "../components/home/CTASection";


function useHomepageStats() {
  const [stats, setStats] = useState({
    businesses: null,
    categories: null,
    cities: null,
  });

  const [cityCounts, setCityCounts] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      const requests = [
        apiClient.get("/businesses", {
          params: { page: 1, limit: 1 },
        }),
        apiClient.get("/businesses/categories"),
        apiClient.get("/businesses/cities"),
      ];

      const results = await Promise.allSettled(requests);

      if (!mounted) return;

      const [businessResult, categoryResult, cityResult] =
        results;

      setStats({
        businesses:
          businessResult.status === "fulfilled" &&
          Number.isInteger(
            businessResult.value.data?.pagination?.total
          )
            ? businessResult.value.data.pagination.total
            : null,

        categories:
          categoryResult.status === "fulfilled" &&
          Array.isArray(categoryResult.value.data)
            ? categoryResult.value.data.length
            : null,

        cities:
          cityResult.status === "fulfilled" &&
          Array.isArray(cityResult.value.data)
            ? cityResult.value.data.length
            : null,
      });
    }

    async function loadCityCounts() {
      const results = await Promise.allSettled(
        popularCities.map((item) =>
          apiClient.get("/businesses", {
            params: {
              city: item.city,
              country: item.country,
              page: 1,
              limit: 1,
            },
          })
        )
      );

      if (!mounted) return;

      const counts = {};

      results.forEach((result, index) => {
        const item = popularCities[index];

        if (
          result.status === "fulfilled" &&
          Number.isInteger(
            result.value.data?.pagination?.total
          )
        ) {
          counts[item.slug] =
            result.value.data.pagination.total;
        }
      });

      setCityCounts(counts);
    }

    loadStats();
    loadCityCounts();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, cityCounts };
}

export default function HomePage() {
  const { stats, cityCounts } = useHomepageStats();
  return (
    <Layout>
      <HeroSection stats={stats} />

      <FeaturedCategories />

      <PopularCities cityCounts={cityCounts} />

      <FeaturedBusinesses />


      <FAQSection />

      <CTASection stats={stats} />
    </Layout>
  );
}
