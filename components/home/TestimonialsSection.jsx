//frontend/components/home/TestimonialsSection.jsx
import SectionWrapper from "./SectionWrapper";
import SectionTitle from "./SectionTitle";

import testimonials from "../../data/testimonials";

export default function TestimonialsSection() {
  return (
    <SectionWrapper>
      <SectionTitle
        title="What Our Community Says"
        subtitle="Experiences shared by members of the Iranian community."
        center
      />

      <div
        className="
          grid
          gap-6
          md:grid-cols-2
          lg:grid-cols-3
        "
      >
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="
              admin-card
              p-6
              flex
              flex-col
              h-full
            "
          >
            <div className="text-turquoise text-lg mb-4">
              ★★★★★
            </div>

            <p
              className="
                text-[var(--text)]
                leading-relaxed
                flex-1
                mb-6
              "
            >
              "{item.text}"
            </p>

            <div>
              <div
                className="
                  font-semibold
                  text-[var(--text)]
                "
              >
                {item.name}
              </div>

              <div
                className="
                  text-sm
                  text-muted
                "
              >
                {item.city}, {item.country}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
