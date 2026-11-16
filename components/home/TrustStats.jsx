//frontend/components/home/TrustStats.jsx
export default function TrustStats({ stats }) {
  const statItems = [
    {
      value: stats?.businesses,
      label: "Businesses",
    },
    {
      value: stats?.categories,
      label: "Categories",
    },
    {
      value: stats?.cities,
      label: "Cities",
    },
  ];

  const visibleStats = statItems.filter(
    (item) =>
      Number.isInteger(item.value) &&
      item.value >= 0
  );

  if (visibleStats.length === 0) {
    return null;
  }

  return (
    <div
      className="
      mt-8
      grid
      grid-cols-3
      gap-2
      sm:gap-4
    
      w-full
      max-w-[520px]
      sm:max-w-xl
    
      mx-auto
    "
    >
      {visibleStats.map((item) => (
        <div
          key={item.label}
          className="
            card
            py-4
            px-2
        
            flex
            flex-col
            items-center
            justify-center
        
            text-center
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
              text-xs
              md:text-base
              text-muted
              w-full
              text-center
              font-sans
            "
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
