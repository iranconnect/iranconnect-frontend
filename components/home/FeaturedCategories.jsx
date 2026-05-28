//frontend/components/home/FeaturedCategories.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";
import CategoryCard from "./CategoryCard";

import featuredCategories from "../../data/featuredCategories";

export default function FeaturedCategories() {
  return (
    <SectionWrapper>
      <SectionTitle
        title="Popular Categories"
        subtitle="Explore trusted Iranian professionals and local services across multiple categories."
        center
      />

      <div
        className="
          grid
          gap-6
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {featuredCategories.map((item) => (
          <CategoryCard
            key={item.slug}
            {...item}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
