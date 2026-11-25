//frontend/components/home/FeaturedBusinesses.jsx
import { useEffect, useState } from "react";
import { Country } from "country-state-city";

import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import BusinessCard from "../BusinessCard";
import RevealOnScroll from "../ui/RevealOnScroll";

import apiClient from "../../utils/apiClient";

async function resolveFeaturedLocation() {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    2500
  );

  let geo = null;

  try {
    const response = await fetch("/api/geo", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      geo = await response.json();
    }
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }

  if (
    !geo ||
    typeof geo.countryCode !== "string" ||
    !/^[A-Z]{2}$/.test(geo.countryCode)
  ) {
    return {};
  }

  const countryName =
    Country.getCountryByCode(geo.countryCode)?.name;

  if (!countryName) return {};

  let country = "";

  try {
    const response = await apiClient.get(
      "/businesses/countries",
      { timeout: 2500 }
    );

    const countries = Array.isArray(response.data)
      ? response.data
      : [];

    const match = countries.find(
      (item) =>
        typeof item.country === "string" &&
        item.country.toLowerCase() ===
          countryName.toLowerCase()
    );

    if (!match) return {};

    country = match.country;
  } catch {
    return {};
  }

  if (
    typeof geo.city !== "string" ||
    !geo.city.trim()
  ) {
    return { country };
  }

  try {
    const response = await apiClient.get(
      "/businesses/cities",
      {
        params: { country },
        timeout: 2500,
      }
    );

    const cities = Array.isArray(response.data)
      ? response.data
      : [];

    const match = cities.find(
      (item) =>
        typeof item.city === "string" &&
        item.city.trim().toLowerCase() ===
          geo.city.trim().toLowerCase()
    );

    return match
      ? { country, city: match.city }
      : { country };
  } catch {
    return { country };
  }
}

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedBusinesses() {
      try {
        const location = await resolveFeaturedLocation();

        if (!mounted) return;

        const response = await apiClient.get(
          "/businesses/featured",
          {
            params: {
              limit: 3,
              ...location,
            },
          }
        );

        if (!mounted) {
          return;
        }

        setBusinesses(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Unable to load featured businesses:",
          error
        );

        if (mounted) {
          setBusinesses([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFeaturedBusinesses();

    return () => {
      mounted = false;
    };
  }, []);

  /*
    Featured is a commercial/curated placement.
    When there are no active placements, do not render
    an empty section or substitute ordinary businesses.
  */
  if (loading || businesses.length === 0) {
    return null;
  }

  const featuredCount = businesses.length;

  const featuredRowWidthClass =
    featuredCount >= 3
      ? "lg:max-w-[1092px]"
      : featuredCount === 2
      ? "lg:max-w-[716px]"
      : "lg:max-w-[346px]";

  return (
    <SectionWrapper>
      <div
        className="
          [&_p]:mx-auto
          [&_p]:max-w-none
          [&_p]:md:whitespace-nowrap
        "
      >
        <RevealOnScroll>
          <SectionTitle
            title="Featured Businesses"
            subtitle="Explore featured Iranian-owned businesses and professionals on IranConnect."
            center
          />
        </RevealOnScroll>
      </div>

      <div
        className={`
          mx-auto
          flex
          w-full
          flex-wrap
          items-stretch
          justify-center
          gap-6
          ${featuredRowWidthClass}
          lg:flex-nowrap
        `}
      >
        {businesses.map((business, index) => (
          <RevealOnScroll
            key={business.id}
            delayMs={Math.min(
              (index % 4) * 45,
              135
            )}
            className={`
              flex
              w-full
              min-w-0
              self-stretch
              md:max-w-sm
              lg:max-w-none
              lg:flex-1
            `}
          >
            <BusinessCard b={business} />
          </RevealOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
