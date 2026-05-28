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
            w-20 h-20
            rounded-xl
            flex items-center justify-center
            bg-[rgba(64,224,208,0.18)]
            border border-[rgba(64,224,208,0.35)]
            shadow-[0_0_20px_rgba(64,224,208,0.08)]
          "
        >
          <img
            src={icon}
            alt={title}
            className="w-12 h-12 object-contain"
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
