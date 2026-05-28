//frontend/components/home/CityCard.jsx
import Link from "next/link";

export default function CityCard({
  city,
  country,
  slug,
  businesses,
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
          "
        >
          <div>
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
          </div>

          <div
            className="
              w-12 h-12
              rounded-xl
              flex items-center justify-center
              bg-[rgba(64,224,208,0.12)]
              border border-[rgba(64,224,208,0.25)]
              text-turquoise
              font-bold
            "
          >
            →
          </div>
        </div>

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
    </Link>
  );
}
