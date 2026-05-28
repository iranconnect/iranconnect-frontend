//iranconnect-frontend/components/home/SectionWrapper.jsx
export default function SectionWrapper({
  children,
  className = "",
}) {
  return (
    <section
      className={`
        py-12 md:py-20
        px-4
        ${className}
      `}
    >
      <div className="mx-auto w-full max-w-5xl">
        {children}
      </div>
    </section>
  );
}
