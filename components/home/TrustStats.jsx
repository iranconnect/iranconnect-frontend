//frontend/components/home/TrustStats.jsx
export default function TrustStats() {
  const stats = [
    {
      value: "120+",
      label: "Businesses",
    },
    {
      value: "15+",
      label: "Categories",
    },
    {
      value: "10+",
      label: "Cities",
    },
  ];

  return (
    <div
      className="
        mt-8
        grid grid-cols-3
        gap-4
        max-w-xl
        mx-auto
      "
    >
      {stats.map((item) => (
        <div
          key={item.label}
          className="
            card
            text-center
            py-4
            px-2
          "
        >
          <div
            className="
              text-2xl md:text-3xl
              font-bold
              text-turquoise
            "
          >
            {item.value}
          </div>

          <div
            className="
              mt-1
              text-sm md:text-base
              text-muted
            "
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
