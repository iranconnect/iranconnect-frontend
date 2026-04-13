//frontend/components/ui/BlurGate.jsx
export default function BlurGate({ isVisible, children }) {
  if (isVisible) return children;

  return (
    <div className="relative">
      {/* 🔒 Blurred content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* 🔒 Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <a
          href={`/auth/login`}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3fd0c9] to-[#2aa7a1] text-white font-medium shadow-lg"
        >
          Login to unlock
        </a>
      </div>
    </div>
  );
}
