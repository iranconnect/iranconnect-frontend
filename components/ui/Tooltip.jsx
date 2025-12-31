//frontend/components/ui/Tooltip.jsx
export default function Tooltip({ text, children }) {
  if (!text) return children;

  return (
    <span className="relative group">
      {children}
      <span
        className="
          absolute z-50 hidden group-hover:block
          bg-gray-900 text-white text-xs
          px-2 py-1 rounded
          bottom-full left-1/2 -translate-x-1/2
          mb-2 max-w-xs
        "
      >
        {text}
      </span>
    </span>
  );
}
