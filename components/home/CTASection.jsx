// frontend/components/home/CTASection.jsx

import Link from "next/link";
import SectionWrapper from "./SectionWrapper";
import RevealOnScroll from "../ui/RevealOnScroll";

export default function CTASection() {
  return (
    <SectionWrapper>
      <RevealOnScroll>
        <div
        className="
          admin-card
          overflow-hidden
          p-6
          md:p-8
          lg:p-12
        "
      >
        <div
          className="
            grid
            lg:grid-cols-2
            gap-8
            lg:gap-12
            items-center
          "
        >
          {/* IMAGE */}
          <div
            className="
              relative
              flex
              justify-center
              order-1
              lg:order-2
            "
          >
            <div
              className="
                absolute
                w-[280px]
                h-[280px]
                md:w-[380px]
                md:h-[380px]
                lg:w-[480px]
                lg:h-[480px]
                rounded-full
                bg-turquoise/20
                blur-[120px]
              "
            />

            <img
              src="/images/iranconnect-register-business-online.webp"
              alt="IranConnect business directory platform helping Iranian-owned businesses increase online visibility, attract customers, and grow across Europe and North America"
              loading="lazy"
              decoding="async"
              className="
                relative
                z-10
                w-full
                max-w-[340px]
                sm:max-w-[460px]
                md:max-w-[560px]
                lg:max-w-[650px]
                xl:max-w-[720px]
                h-auto
              "
            />
          </div>

          {/* CONTENT */}
          <div
            className="
              order-2
              lg:order-1
            "
          >
            <span
              className="
                inline-flex
                items-center
                rounded-full
                px-4
                py-1
                text-sm
                font-medium
                bg-turquoise/10
                text-turquoise
                mb-5
              "
            >
              🚀 Business Growth
            </span>

            <h2
              className="
                text-4xl
                md:text-5xl
                lg:text-6xl
                font-bold
                text-[var(--text)]
                leading-tight
                mb-5
              "
            >
              Ready to Reach More Customers?
            </h2>

            <p
              className="
                text-base
                md:text-lg
                text-muted
                max-w-xl
                mb-8
              "
            >
              Join hundreds of Iranian-owned businesses already
              connecting with users across Europe and North America.
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-4
                mb-8
                text-sm
                font-medium
              "
            >
              <span className="admin-card px-4 py-2">
                120+ Businesses
              </span>

              <span className="admin-card px-4 py-2">
                15+ Categories
              </span>

              <span className="admin-card px-4 py-2">
                10+ Cities
              </span>
            </div>

            <Link
              href="/account/new-business"
              className="
                btn-primary
                inline-flex
                items-center
                justify-center
                w-full
                sm:w-auto
                min-w-[220px]
                px-10
                py-4
              "
            >
              Add Your Business
            </Link>
          </div>
        </div>
        </div>
      </RevealOnScroll>
    </SectionWrapper>
  );
}
