//frontend/components/business/BusinessStickyCTA.jsx
import {
  Phone,
  MessageCircle,
  Lock,
} from "lucide-react";

function cleanWhatsApp(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function BusinessStickyCTA({
  biz,
  phoneWithCode,
  isVisible,
  isLoggedIn,
}) {
  if (!biz) {
    return null;
  }

  const phoneDisplay = phoneWithCode || biz.phone || null;

  const phoneHref = phoneDisplay
    ? `tel:${String(phoneDisplay).replace(/\s+/g, "")}`
    : null;

  const whatsappNumber = cleanWhatsApp(
    biz.whatsapp_number
  );

  const hasCTA =
    Boolean(phoneHref) ||
    Boolean(whatsappNumber);

  if (!isLoggedIn) {
    return (
      <div
        data-cta
        className={`
          fixed bottom-0 left-0 right-0 z-[9999] md:hidden
          transition-all duration-300
          ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-full opacity-0"
          }
        `}
      >
        <div className="px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg">
          <a
            href={`/auth/login?redirect=/business/${biz.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 font-medium text-white transition hover:bg-teal-600"
          >
            <Lock size={18} />
            Sign in to view contact details
          </a>
        </div>
      </div>
    );
  }

  if (!hasCTA) {
    return null;
  }

  return (
    <div
      data-cta
      className={`
        fixed bottom-0 left-0 right-0 z-[9999] md:hidden
        transition-all duration-300
        ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }
      `}
    >
      <div className="flex gap-3 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg">
        {phoneHref && (
          <a
            href={phoneHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 font-medium text-white transition hover:bg-teal-600"
          >
            <Phone size={18} />
            Call
          </a>
        )}

        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 font-medium text-white transition hover:bg-teal-600"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
