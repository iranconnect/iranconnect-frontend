//frontend/components/home/CityCard.jsx

import Link from "next/link";
import Image from "next/image";

export default function CityCard({
  city,
  country,
  slug,
  businesses,
  image,
  imageAlt,
}) {
  return (
    <Link
      href={{
        pathname: "/search",
        query: { country, city },
      }}
      className="block group h-[184px]"
    >
      <div
        className="
          card
          h-full
          p-5
          transition-all
          duration-300
          hover:-translate-y-1
        "
      >
        <div
          className="
            flex
            h-full
            items-center
            justify-between
            gap-4
          "
        >
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="
                text-xl
                font-semibold
                leading-7
                min-h-[3.5rem]
                line-clamp-2
                text-[var(--text)]
                group-hover:text-turquoise
                transition-colors
              "
            >
              {city}
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-[var(--text)]
                opacity-70
              "
            >
              {country}
            </p>

            <div
              className="
                mt-5
                text-sm
                text-[var(--text)]
                opacity-75
              "
            >
              {Number.isInteger(businesses) &&
              businesses >= 0
                ? `${businesses} ${
                    businesses === 1
                      ? "business"
                      : "businesses"
                  }`
                : null}
            </div>
          </div>

          {/* City Illustration */}
          <div
            className="
              relative
              w-28
              sm:w-40
              h-24
              sm:h-28
              shrink-0
            "
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              unoptimized
              sizes="160px"
              className="
                object-contain
                opacity-60
                group-hover:opacity-100
                transition-all
                duration-300
              "
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
