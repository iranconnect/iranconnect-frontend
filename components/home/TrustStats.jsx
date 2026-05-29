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
      grid
      grid-cols-3
      gap-2
      sm:gap-4
    
      w-full
      max-w-md
      sm:max-w-xl
    
      mx-auto
    "
    >
      {stats.map((item) => (
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
              text-sm
              md:text-base
              text-muted
              w-full
              text-center
            "
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
