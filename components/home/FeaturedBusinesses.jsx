//frontend/components/home/FeaturedBusinesses.jsx
import { useEffect, useState } from "react";

import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import BusinessCard from "../BusinessCard";

import apiClient from "../../utils/apiClient";

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedBusinesses() {
      try {
        const response = await apiClient.get(
          "/businesses/featured?limit=3"
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

  const cardWidthClass =
    featuredCount >= 3
      ? "lg:w-[calc((100%-3rem)/3)]"
      : featuredCount === 2
      ? "lg:w-[calc((100%-1.5rem)/2)] max-w-sm"
      : "lg:w-[346px] max-w-sm";

  return (
    <SectionWrapper>
      <SectionTitle
        title="Featured Businesses"
        subtitle="Discover trusted Iranian-owned businesses and professionals recommended by the community."
        center
      />

      <div
        className="
          flex
          flex-wrap
          justify-center
          gap-6
          items-stretch
          lg:flex-nowrap
        "
      >
        {businesses.map((business) => (
          <div
            key={business.id}
            className={`w-full max-w-sm h-full ${cardWidthClass}`}
          >
            <BusinessCard b={business} />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
