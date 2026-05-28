//frontend/components/home/HeroSection.jsx
import SectionWrapper from "./SectionWrapper";
import SearchFilters from "./SearchFilters";
import TrustStats from "./TrustStats";
import HeroCTA from "./HeroCTA";

export default function HeroSection() {
  return (
    <SectionWrapper className="pt-10 md:pt-16">
      <div className="card text-center">
        <h1
          className="
            text-3xl md:text-5xl
            font-bold
            text-[var(--text)]
            leading-tight
          "
        >
          Find trusted Iranian businesses worldwide
        </h1>

        <p
          className="
            mt-4
            text-base md:text-lg
            text-muted
            max-w-2xl
            mx-auto
            leading-relaxed
          "
        >
          Discover trusted professionals, local services, and
          Iranian-owned businesses across Europe and North America.
        </p>

        <SearchFilters />

        <TrustStats />

        <HeroCTA />
      </div>
    </SectionWrapper>
  );
}
