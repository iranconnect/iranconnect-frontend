import {
  Globe,
  Phone,
  Mail,
  Lock,
} from "lucide-react";

import SocialBrandIcon from "./contact/SocialBrandIcon";

export default function BusinessContact({
  biz,
  contactModel,
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

  const {
    phone,
    email,
    website,
    whatsapp,
    social,
    hasSocialLinks,
    hasAnyContact,
  } = contactModel;

  if (!hasAnyContact) {
    return null;
  }

  return (
    <section className="card mt-6">
      <h2 className="text-xl font-semibold mb-5">
        Contact & Online Presence
      </h2>

      <div className="space-y-4 text-sm">
        {phone.available && (
          <div>
            <h3 className="mb-1 font-semibold">
              Phone
            </h3>

            <a
              href={phone.href}
              className="inline-flex items-center gap-2 text-turquoise hover:underline"
            >
              <Phone size={17} />
              {phone.displayValue}
            </a>
          </div>
        )}

        {email.available && (
          <div>
            <h3 className="mb-1 font-semibold">
              Email
            </h3>

            <a
              href={email.href}
              className="inline-flex items-center gap-2 break-all text-turquoise hover:underline"
            >
              <Mail size={17} />
              {email.displayValue}
            </a>
          </div>
        )}

        {website.available && (
          <div>
            <h3 className="mb-1 font-semibold">
              Website
            </h3>

            <a
              href={website.href}
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
              {social.instagram.available && (
                <a
                  href={social.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-pink-500"
                >
                  <SocialBrandIcon
                    platform="instagram"
                    size={19}
                  />
                </a>
              )}

              {social.facebook.available && (
                <a
                  href={social.facebook.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-blue-600"
                >
                  <SocialBrandIcon
                    platform="facebook"
                    size={19}
                  />
                </a>
              )}

              {social.linkedin.available && (
                <a
                  href={social.linkedin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-blue-700"
                >
                  <SocialBrandIcon
                    platform="linkedin"
                    size={19}
                  />
                </a>
              )}

              {social.x.available && (
                <a
                  href={social.x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  title="X"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-black"
                >
                  <SocialBrandIcon
                    platform="x"
                    size={19}
                  />
                </a>
              )}

              {social.telegram.available && (
                <a
                  href={social.telegram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  title="Telegram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-sky-500"
                >
                  <SocialBrandIcon
                    platform="telegram"
                    size={19}
                  />
                </a>
              )}

              {whatsapp.available && (
                <a
                  href={whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition hover:text-green-500"
                >
                  <SocialBrandIcon
                    platform="whatsapp"
                    size={19}
                  />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
