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
  Lock,
} from "lucide-react";

function cleanWhatsApp(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeExternalUrl(value) {
  if (!value) return null;

  const rawValue = String(value).trim();

  if (!rawValue) return null;

  const candidate = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const parsed = new URL(candidate);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

export default function BusinessContact({
  biz,
  phoneWithCode,
  isLoggedIn,
}) {
  if (!isLoggedIn) {
    const loginHref =
      `/auth/login?redirect=/business/${biz.slug}`;

    return (
      <section className="card mt-6">
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)]">
            <Lock
              size={20}
              className="text-turquoise"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-xl font-semibold">
            Contact & Online Presence
          </h2>

          <p className="mt-2 max-w-lg text-sm text-muted">
            Sign in to view contact details and connect directly
            with this business.
          </p>

          <a
            href={loginHref}
            className="btn-primary mt-5 !w-auto px-6 py-2.5"
          >
            Sign in to view contact details
          </a>
        </div>
      </section>
    );
  }

  const phoneDisplay = phoneWithCode || biz.phone || null;

  const phoneHref = phoneDisplay
    ? `tel:${String(phoneDisplay).replace(/\s+/g, "")}`
    : null;

  const email = biz.email
    ? String(biz.email).trim()
    : null;

  const websiteUrl = normalizeExternalUrl(biz.website);
  const instagramUrl = normalizeExternalUrl(
    biz.instagram_url
  );
  const facebookUrl = normalizeExternalUrl(
    biz.facebook_url
  );
  const linkedinUrl = normalizeExternalUrl(
    biz.linkedin_url
  );
  const twitterUrl = normalizeExternalUrl(
    biz.twitter_url
  );
  const telegramUrl = normalizeExternalUrl(
    biz.telegram_url
  );

  const whatsappNumber = cleanWhatsApp(
    biz.whatsapp_number
  );

  const hasSocialLinks = Boolean(
    instagramUrl ||
      facebookUrl ||
      linkedinUrl ||
      twitterUrl ||
      telegramUrl ||
      whatsappNumber
  );

  const hasAnyContact =
    Boolean(phoneHref) ||
    Boolean(email) ||
    Boolean(websiteUrl) ||
    hasSocialLinks;

  if (!hasAnyContact) {
    return null;
  }

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-5">
        Contact & Online Presence
      </h2>

      <div className="space-y-4 text-sm">
        {phoneHref && (
          <div>
            <h3 className="mb-1 font-semibold">
              Phone
            </h3>

            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 text-turquoise hover:underline"
            >
              <Phone size={17} />
              {phoneDisplay}
            </a>
          </div>
        )}

        {email && (
          <div>
            <h3 className="mb-1 font-semibold">
              Email
            </h3>

            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 break-all text-turquoise hover:underline"
            >
              <Mail size={17} />
              {email}
            </a>
          </div>
        )}

        {websiteUrl && (
          <div>
            <h3 className="mb-1 font-semibold">
              Website
            </h3>

            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 break-all text-turquoise hover:underline"
            >
              <Globe size={17} />
              Visit website
            </a>
          </div>
        )}

        {hasSocialLinks && (
          <div>
            <h3 className="mb-3 font-semibold">
              Social & Messaging
            </h3>

            <div className="flex flex-wrap gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-pink-500"
                >
                  <Instagram size={19} />
                </a>
              )}

              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-blue-600"
                >
                  <Facebook size={19} />
                </a>
              )}

              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-blue-700"
                >
                  <Linkedin size={19} />
                </a>
              )}

              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  title="X"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-black"
                >
                  <Twitter size={19} />
                </a>
              )}

              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  title="Telegram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-sky-500"
                >
                  <Send size={19} />
                </a>
              )}

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-green-500"
                >
                  <MessageCircle size={19} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
