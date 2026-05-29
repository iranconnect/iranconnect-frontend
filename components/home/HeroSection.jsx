//frontend/components/home/HeroSection.jsx
import SectionWrapper from "./SectionWrapper";
import SearchFilters from "./SearchFilters";
import TrustStats from "./TrustStats";
import HeroCTA from "./HeroCTA";

export default function HeroSection() {
  return (
    <SectionWrapper className="pt-10 md:pt-16">
      <div className="card overflow-hidden">
        <div
          className="
            grid
            lg:grid-cols-2
            gap-10
            items-center
          "
        >
          {/* IMAGE FIRST ON MOBILE */}
          <div
            className="
              order-1
              lg:order-2
              relative
              flex
              justify-center
            "
          >
            <div
              className="
                absolute
                w-[320px]
                h-[320px]
                md:w-[500px]
                md:h-[500px]
                rounded-full
                bg-turquoise/10
                blur-[140px]
              "
            />

            <img
              src="/images/find-trusted-iranian-businesses-worldwide.webp"
              alt="Find trusted Iranian businesses, local services, and professionals worldwide through the IranConnect global business directory"
              loading="eager"
              fetchPriority="high"
              className="
                relative
                z-10
                w-full
                max-w-[420px]
                md:max-w-[620px]
                lg:max-w-[760px]
                h-auto
              "
            />
          </div>

          {/* CONTENT */}
          <div
            className="
              order-2
              lg:order-1
              text-center
              lg:text-left
            "
          >
            <h1
              className="
                text-4xl
                md:text-5xl
                lg:text-6xl
                font-bold
                text-[var(--text)]
                leading-tight
              "
            >
              Find trusted Iranian businesses worldwide
            </h1>

            <p
              className="
                mt-5
                text-base
                md:text-lg
                text-muted
                max-w-2xl
                mx-auto
                lg:mx-0
                leading-relaxed
              "
            >
              Discover trusted professionals, local services,
              and Iranian-owned businesses across Europe and
              North America.
            </p>

            <div className="mt-8">
              <SearchFilters />
            </div>

            <div className="mt-8">
              <TrustStats />
            </div>

            <div className="mt-8">
              <HeroCTA />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
