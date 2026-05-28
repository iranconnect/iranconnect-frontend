//frontend/components/home/SectionTitle.jsx
export default function SectionTitle({
  title,
  subtitle,
  center = false,
}) {
  return (
    <div
      className={`
        mb-8 md:mb-10
        ${center ? "text-center" : ""}
      `}
    >
      <h2
        className="
          text-2xl md:text-4xl
          font-bold
          text-[#102139]
          dark:text-[#102139]
          tracking-tight
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mt-3
            text-base md:text-lg
            text-[#334155]
            dark:text-[#334155]
            max-w-2xl
            leading-relaxed
            mx-auto
          "
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
