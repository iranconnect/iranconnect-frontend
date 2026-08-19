//frontend/components/home/FeaturedCategories.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import RevealOnScroll from "../ui/RevealOnScroll";
import CategoryCard from "./CategoryCard";

import featuredCategories from "../../data/featuredCategories";

export default function FeaturedCategories() {
  return (
    <SectionWrapper>
      <RevealOnScroll>
        <SectionTitle
          title="Popular Categories"
          subtitle="Explore trusted Iranian professionals and local services across multiple categories."
          center
        />
      </RevealOnScroll>

      <div
        className="
          grid
          gap-6
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {featuredCategories.map((item, index) => (
          <RevealOnScroll
            key={item.slug}
            delayMs={Math.min(
              (index % 4) * 45,
              135
            )}
          >
            <CategoryCard {...item} />
          </RevealOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
