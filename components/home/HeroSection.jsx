//frontend/components/home/HeroSection.jsx

import SectionWrapper from "./SectionWrapper";
import TrustStats from "./TrustStats";
import HeroCTA from "./HeroCTA";

export default function HeroSection() {
  return (
    <SectionWrapper className="pt-10 md:pt-16">
      <div
        className="
          card
          relative
          overflow-hidden
          text-center

          pt-[120px]
          sm:pt-[160px]
          md:pt-[220px]
          lg:pt-[360px]
          xl:pt-[50px]

          pb-[280px]
          md:pb-[320px]
          lg:pb-[380px]
          xl:pb-[200px]
        "
      >
        {/* Background Illustration */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            flex
            justify-center
            pointer-events-none
          "
        >
          {/* Desktop Illustration */}
          <img
            src="/images/find-trusted-iranian-businesses-worldwide.webp"
            alt="Find trusted Iranian businesses, local services, and professionals worldwide through the IranConnect global business directory"
            loading="eager"
            fetchPriority="high"
            className="
              hidden
              xl:block

              w-full
              max-w-[1600px]
              h-auto

              opacity-[0.12]
              md:opacity-[0.15]
              lg:opacity-[0.18]

              object-contain
            "
          />

          {/* Mobile + Tablet Illustration */}
          <img
            src="/images/find-trusted-iranian-businesses-worldwide-mobile-version.webp"
            alt="Find trusted Iranian businesses, local services, and professionals worldwide through the IranConnect global business directory"
            loading="eager"
            className="
              block
              xl:hidden

              w-full
              max-w-[520px]
              h-auto

              opacity-[0.12]

              object-contain
            "
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1
            className="
              text-5xl
              md:text-6xl
              lg:text-7xl
              font-bold
              text-[var(--text)]
              leading-tight
            "
          >
            Find trusted Iranian businesses worldwide
          </h1>

          <p
            className="
              mt-6
              text-lg
              md:text-xl
              text-muted
              max-w-4xl
              mx-auto
              leading-relaxed
            "
          >
            Discover trusted professionals, local services,
            and Iranian-owned businesses across Europe and
            North America.
          </p>

          <div className="mt-14 flex justify-center">
            <TrustStats />
          </div>

          <div className="mt-12 flex justify-center">
            <HeroCTA />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
