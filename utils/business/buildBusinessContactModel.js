function normalizeExternalUrl(value) {
  if (!value) return null;

  const rawValue = String(value).trim();

  if (!rawValue) return null;

  const hasHttpScheme =
    /^https?:\/\//i.test(rawValue);

  const hasExplicitScheme =
    /^[a-z][a-z0-9+.-]*:/i.test(rawValue);

  if (
    hasExplicitScheme &&
    !hasHttpScheme
  ) {
    return null;
  }

  const candidate =
    hasHttpScheme
      ? rawValue
      : rawValue.startsWith("//")
        ? `https:${rawValue}`
        : `https://${rawValue}`;

  try {
    const parsed = new URL(candidate);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function normalizePhoneDisplay(value) {
  if (!value) return null;

  const normalized = String(value).trim();

  return normalized || null;
}

function buildPhoneHref(value) {
  if (!value) return null;

  const rawValue =
    String(value).trim();

  if (!rawValue) return null;

  const hasLeadingPlus =
    rawValue.startsWith("+");

  const digits =
    rawValue.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `tel:${
    hasLeadingPlus ? "+" : ""
  }${digits}`;
}

function normalizeEmail(value) {
  if (!value) return null;

  const normalized = String(value).trim();

  return normalized || null;
}

function normalizeWhatsAppNumber(value) {
  if (!value) return null;

  const normalized =
    String(value).replace(/\D/g, "");

  return normalized || null;
}

function buildChannel({
  displayValue = null,
  href = null,
}) {
  return {
    available: Boolean(href),
    displayValue,
    href,
  };
}

export function buildBusinessContactModel({
  biz,
  phoneWithCode,
} = {}) {
  const business = biz || {};

  const phoneDisplay =
    normalizePhoneDisplay(
      phoneWithCode || business.phone
    );

  const phoneHref =
    buildPhoneHref(phoneDisplay);

  const email =
    normalizeEmail(business.email);

  const website =
    normalizeExternalUrl(business.website);

  const whatsappNumber =
    normalizeWhatsAppNumber(
      business.whatsapp_number
    );

  const instagram =
    normalizeExternalUrl(
      business.instagram_url
    );

  const facebook =
    normalizeExternalUrl(
      business.facebook_url
    );

  const linkedin =
    normalizeExternalUrl(
      business.linkedin_url
    );

  const x =
    normalizeExternalUrl(
      business.twitter_url
    );

  const telegram =
    normalizeExternalUrl(
      business.telegram_url
    );

  const model = {
    phone: buildChannel({
      displayValue: phoneDisplay,
      href: phoneHref,
    }),

    email: buildChannel({
      displayValue: email,
      href: email
        ? `mailto:${email}`
        : null,
    }),

    website: buildChannel({
      displayValue: website,
      href: website,
    }),

    whatsapp: buildChannel({
      displayValue: whatsappNumber,
      href: whatsappNumber
        ? `https://wa.me/${whatsappNumber}`
        : null,
    }),

    social: {
      instagram: buildChannel({
        href: instagram,
      }),

      facebook: buildChannel({
        href: facebook,
      }),

      linkedin: buildChannel({
        href: linkedin,
      }),

      x: buildChannel({
        href: x,
      }),

      telegram: buildChannel({
        href: telegram,
      }),
    },
  };

  model.hasSocialLinks = Boolean(
    model.social.instagram.available ||
    model.social.facebook.available ||
    model.social.linkedin.available ||
    model.social.x.available ||
    model.social.telegram.available ||
    model.whatsapp.available
  );

  model.hasAnyContact = Boolean(
    model.phone.available ||
    model.email.available ||
    model.website.available ||
    model.hasSocialLinks
  );

  model.hasPrimaryCTA = Boolean(
    model.phone.available ||
    model.whatsapp.available
  );

  return model;
}

export {
  normalizeExternalUrl,
  normalizeWhatsAppNumber,
};
