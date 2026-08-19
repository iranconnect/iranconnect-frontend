//frontend/components/home/PopularCities.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import CityCard from "./CityCard";
import RevealOnScroll from "../ui/RevealOnScroll";

import popularCities from "../../data/popularCities";

export default function PopularCities() {
  return (
    <SectionWrapper>
      <RevealOnScroll>
        <SectionTitle
          title="Popular Cities"
          subtitle="Explore Iranian businesses and professionals in major cities worldwide."
          center
        />
      </RevealOnScroll>

      <div
        className="
          grid
          gap-6
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {popularCities.map((item, index) => (
          <RevealOnScroll
            key={item.slug}
            delayMs={Math.min(
              (index % 4) * 45,
              135
            )}
          >
            <CityCard {...item} />
          </RevealOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
