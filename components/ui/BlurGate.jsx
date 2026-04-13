//frontend/components/ui/BlurGate.jsx
export default function BlurGate({ isVisible, children }) {
  if (isVisible) return children;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}
