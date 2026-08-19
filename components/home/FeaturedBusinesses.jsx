//frontend/components/home/FeaturedBusinesses.jsx
import { useEffect, useState } from "react";

import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import BusinessCard from "../BusinessCard";
import RevealOnScroll from "../ui/RevealOnScroll";

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
            subtitle="Discover trusted Iranian-owned businesses and professionals recommended by the community."
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
