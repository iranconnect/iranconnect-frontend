//frontend/components/home/CategoryCard.jsx
import Link from "next/link";

export default function CategoryCard({
  title,
  description,
  icon,
  slug,
}) {
  return (
    <Link
      href={`/search?category=${slug}`}
      className="block group h-full"
    >
      <div
        className="
          card
          h-full
          p-6
          transition-all
          duration-300
          hover:-translate-y-1
        "
      >
        <div
          className="
            relative
            h-52
            -mx-6
            -mt-6
            mb-5
            overflow-hidden
            rounded-t-2xl
          "
        >
          <img
            src={icon}
            alt={title}
            className="
              w-full
              h-full
              object-cover
              opacity-90
              transition-transform
              duration-500
              group-hover:scale-105
            "
            loading="lazy"
          />
        </div>

        <h3
          className="
            mt-5
            text-xl
            font-semibold
            text-[var(--text)]
            group-hover:text-turquoise
            transition-colors
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-3
            text-sm
            text-[var(--text)]
            opacity-80
            leading-relaxed
          "
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
