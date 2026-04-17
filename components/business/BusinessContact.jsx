//frontend/components/business/BusinessContact.jsx
import {
  Globe,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Send,
  MessageCircle,
} from "lucide-react";

export default function BusinessContact({ biz }) {
  const isLoggedIn = biz.viewer_is_authenticated;

  const hasAny =
    biz.phone ||
    biz.email ||
    biz.website ||
    biz.instagram_url ||
    biz.facebook_url ||
    biz.linkedin_url ||
    biz.twitter_url ||
    biz.telegram_url ||
    biz.whatsapp_number;

  if (!hasAny) return null;

  function cleanWhatsApp(num) {
    return num?.replace(/\D/g, "");
  }

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Contact & Online Presence
      </h2>

      <div className="space-y-4">

        {/* 📞 Phone */}
        {biz.phone && biz.show_phone && (
          <a
            href={isLoggedIn ? `tel:${biz.phone}` : "#"}
            className={`flex items-center gap-3 ${
              !isLoggedIn ? "blur-sm pointer-events-none" : ""
            }`}
          >
            <Phone size={18} />
            <span>{biz.phone}</span>
          </a>
        )}

        {/* 📧 Email */}
        {biz.email && biz.show_email && (
          <a
            href={isLoggedIn ? `mailto:${biz.email}` : "#"}
            className={`flex items-center gap-3 ${
              !isLoggedIn ? "blur-sm pointer-events-none" : ""
            }`}
          >
            <Mail size={18} />
            <span>{biz.email}</span>
          </a>
        )}

        {/* 🌐 Website */}
        {biz.website && (
          <a
            href={biz.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3"
          >
            <Globe size={18} />
            <span>Website</span>
          </a>
        )}

        {/* 🔥 Social Icons Row */}
        <div className="flex flex-wrap gap-3 pt-2">

          {biz.instagram_url && (
            <a href={biz.instagram_url} target="_blank">
              <Instagram className="hover:text-pink-500" />
            </a>
          )}

          {biz.facebook_url && (
            <a href={biz.facebook_url} target="_blank">
              <Facebook className="hover:text-blue-600" />
            </a>
          )}

          {biz.linkedin_url && (
            <a href={biz.linkedin_url} target="_blank">
              <Linkedin className="hover:text-blue-700" />
            </a>
          )}

          {biz.twitter_url && (
            <a href={biz.twitter_url} target="_blank">
              <Twitter className="hover:text-black" />
            </a>
          )}

          {biz.telegram_url && (
            <a href={biz.telegram_url} target="_blank">
              <Send className="hover:text-sky-500" />
            </a>
          )}

          {biz.whatsapp_number && (
            <a
              href={`https://wa.me/${cleanWhatsApp(
                biz.whatsapp_number
              )}`}
              target="_blank"
            >
              <MessageCircle className="hover:text-green-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
