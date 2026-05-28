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
            w-14 h-14
            rounded-xl
            flex items-center justify-center
            bg-[rgba(64,224,208,0.08)]
            border border-[rgba(64,224,208,0.15)]
          "
        >
          <img
            src={icon}
            alt={title}
            className="w-7 h-7 object-contain"
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
            text-muted
            leading-relaxed
          "
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
