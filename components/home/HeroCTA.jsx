//frontend/components/home/HeroCTA.jsx
import Link from "next/link";

export default function HeroCTA() {
  return (
    <div
      className="
        mt-8
        flex flex-col sm:flex-row
        items-center
        justify-center
        gap-4
      "
    >
      <Link
        href="/search"
        className="
          btn-primary
          sm:w-auto
          px-8
        "
      >
        Explore Businesses
      </Link>

      <Link
        href="/account/new-business"
        className="
          btn-ghost
          w-full sm:w-auto
          px-8 py-3
          text-center
        "
      >
        Add Your Business
      </Link>
    </div>
  );
}
