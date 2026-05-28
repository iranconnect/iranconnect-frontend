//frontend/components/home/FeaturedBusinesses.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";

import BusinessCard from "../BusinessCard";

import featuredBusinesses from "../../data/featuredBusinesses";

export default function FeaturedBusinesses() {
  return (
    <SectionWrapper>
      <SectionTitle
        title="Featured Businesses"
        subtitle="Discover trusted Iranian-owned businesses and professionals recommended by the community."
        center
      />

      <div
        className="
          grid
          gap-6
          lg:grid-cols-3
        "
      >
        {featuredBusinesses.map((business) => (
          <BusinessCard
            key={business.id}
            b={business}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
