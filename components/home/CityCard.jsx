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
      href={`/search?city=${slug}`}
      className="block group"
    >
      <div
        className="
          card
          p-5
          transition-all
          duration-300
          hover:-translate-y-1
        "
      >
        <div
          className="
            flex
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
              {businesses}
            </div>
          </div>

          {/* City Illustration */}
          <div
            className="
              relative
              w-40
              h-28
              shrink-0
            "
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
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
