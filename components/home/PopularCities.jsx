//frontend/components/home/PopularCities.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import CityCard from "./CityCard";

import popularCities from "../../data/popularCities";

export default function PopularCities() {
  return (
    <SectionWrapper>
      <SectionTitle
        title="Popular Cities"
        subtitle="Explore Iranian businesses and professionals in major cities worldwide."
        center
      />

      <div
        className="
          grid
          gap-6
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {popularCities.map((item) => (
          <CityCard
            key={item.slug}
            {...item}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
