//frontend/components/home/CTASection.jsx
import Link from "next/link";
import SectionWrapper from "./SectionWrapper";

export default function CTASection() {
  return (
    <SectionWrapper>
      <div
        className="
          admin-card
          text-center
          py-14
          px-6
        "
      >
        <h2
          className="
            text-3xl
            md:text-4xl
            font-bold
            mb-4
            text-[var(--text)]
          "
        >
          Ready to Grow Your Business?
        </h2>

        <p
          className="
            text-muted
            max-w-2xl
            mx-auto
            mb-8
          "
        >
          Join IranConnect today and connect with users across
          Europe and North America.
        </p>

        <Link
          href="/account/new-business"
          className="
            btn-primary
            inline-flex
          "
        >
          Add Your Business
        </Link>
      </div>
    </SectionWrapper>
  );
}
