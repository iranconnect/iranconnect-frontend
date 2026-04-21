//frontend/components/business/BusinessStickyCTA.jsx
import { Phone, MessageCircle } from "lucide-react";

export default function BusinessStickyCTA({ biz, isLoggedIn }) {
  if (!biz) return null;

  const hasCTA = biz.phone || biz.whatsapp_number;
  if (!hasCTA) return null;

  function cleanWhatsApp(num) {
    return num?.replace(/\D/g, "");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t shadow-lg px-4 py-3 flex gap-3">

        {/* 📞 Call */}
        {biz.phone && biz.show_phone && (
          <a
            href={isLoggedIn ? `tel:${biz.phone}` : "#"}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-medium ${
              !isLoggedIn ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Phone size={18} />
            Call
          </a>
        )}

        {/* 💬 WhatsApp */}
        {biz.whatsapp_number && (
          <a
            href={
              isLoggedIn
                ? `https://wa.me/${cleanWhatsApp(biz.whatsapp_number)}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-medium ${
              !isLoggedIn ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
