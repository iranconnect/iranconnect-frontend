//frontend/components/home/CTASection.jsx
import Link from "next/link";

import SectionWrapper from "./SectionWrapper";

export default function CTASection() {
  return (
    <SectionWrapper>
      <div
        className="
          admin-card
          overflow-hidden
          p-8
          lg:p-12
        "
      >
        <div
          className="
            grid
            lg:grid-cols-2
            gap-10
            items-center
          "
        >
          {/* LEFT */}
          <div>
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
                text-5xl
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
                text-lg
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
                gap-6
                mb-8
                text-sm
                font-medium
              "
            >
              <span className="admin-card px-4 py-2">120+ Businesses</span>
              <span className="admin-card px-4 py-2">15+ Categories</span>
              <span className="admin-card px-4 py-2">10+ Cities</span>
            </div>

            <Link
              href="/account/new-business"
              className="
                btn-primary
                inline-flex
                w-fit
                px-10
              "
            >
              Add Your Business
            </Link>
          </div>

          {/* RIGHT */}
          <div
            className="
              flex
              justify-center
              relative
            "
          >
            <div
              className="
                absolute
                w-[420px]
                h-[420px]
                rounded-full
                bg-turquoise/20
                blur-3xl
              "
            />
          
            <img
              src="/images/iranconnect-register-business-online.webp"
              alt="Register your business on IranConnect"
              className="
                relative
                z-10
                w-full
                max-w-none
                w-[120%]
                h-auto
              "
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
