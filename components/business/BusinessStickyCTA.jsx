//frontend/components/business/BusinessStickyCTA.jsx
import { Phone, MessageCircle } from "lucide-react";

export default function BusinessStickyCTA({ biz, isLoggedIn }) {
  console.log("CTA biz:", biz);
  console.log("CTA fields:", {
  phone: biz?.phone,
  show_phone: biz?.show_phone,
  whatsapp: biz?.whatsapp_number,
});
  if (!biz) return null;

  // ✅ فقط برای کاربران لاگین شده
  if (!isLoggedIn) return null;

  const hasCTA =
    (biz.phone && biz.show_phone) ||
    biz.whatsapp_number;

  if (!hasCTA) return null;

  function cleanWhatsApp(num) {
    return num?.replace(/\D/g, "");
  }

  return (
    <div
      data-cta
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden"
    >
      <div className="bg-red-500 border-4 border-blue-500 shadow-lg px-4 py-3 flex gap-3">

        {/* 📞 Call */}
        {biz.phone && biz.show_phone && (
          <a
            href={`tel:${biz.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-medium"
          >
            <Phone size={18} />
            Call
          </a>
        )}

        {/* 💬 WhatsApp */}
        {biz.whatsapp_number && (
          <a
            href={`https://wa.me/${cleanWhatsApp(biz.whatsapp_number)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-medium"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
