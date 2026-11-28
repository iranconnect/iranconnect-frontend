// components/Footer.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Instagram,
  Facebook,
  Twitter,
  Send,
  Linkedin,
  ChevronDown,
} from 'lucide-react';

const FOOTER_TEXT = {
  en: {
    description:
      'Helping Iranians abroad find professionals and connect with their community.',
    explore: 'Explore',
    search: 'Explore Businesses',
    categories: 'Browse Categories',
    cities: 'Popular Cities',
    addBusiness: 'Add Your Business',
    about: 'About Us',
    faq: 'FAQ',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    cookies: 'Cookies Policy',
    copyright: 'All rights reserved',
    cookieSettings: 'Change cookie settings',
  },
  fr: {
    description:
      "Aider les Iraniens à l’étranger à trouver des professionnels et à rester en contact avec leur communauté.",
    explore: 'Explorer',
    search: 'Explorer les entreprises',
    categories: 'Parcourir les catégories',
    cities: 'Villes populaires',
    addBusiness: 'Ajouter votre entreprise',
    about: 'À propos',
    faq: 'FAQ',
    legal: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    terms: "Conditions d’utilisation",
    cookies: 'Politique de cookies',
    copyright: 'Tous droits réservés',
    cookieSettings: 'Modifier les cookies',
  },
  fa: {
    description:
      'کمک به ایرانیان خارج از کشور برای یافتن متخصصان و ارتباط با جامعه ایرانی.',
    explore: 'جستجو و کشف',
    search: 'جستجوی کسب‌وکارها',
    categories: 'مرور دسته‌بندی‌ها',
    cities: 'شهرهای محبوب',
    addBusiness: 'ثبت کسب‌وکار شما',
    about: 'درباره ما',
    faq: 'سؤالات متداول',
    legal: 'اطلاعات حقوقی',
    privacy: 'سیاست حفظ حریم خصوصی',
    terms: 'شرایط استفاده',
    cookies: 'سیاست کوکی‌ها',
    copyright: 'تمام حقوق محفوظ است',
    cookieSettings: 'تغییر تنظیمات کوکی‌ها',
  },
};

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/iranconnect.0rg',
    Icon: Instagram,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/share/1AgNy5a5pr/',
    Icon: Facebook,
  },
  {
    name: 'X',
    href: 'https://x.com/iranconnectorg',
    Icon: Twitter,
  },
  {
    name: 'Telegram',
    href: 'https://t.me/iranconnectcommunity',
    Icon: Send,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/iranconnect-community-41522039a',
    Icon: Linkedin,
  },
];

function FooterLinks({ links }) {
  return (
    <ul className="ic-footer-links">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} prefetch={false}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div className="ic-footer-group">
      <div className="ic-footer-desktop-group">
        <h4>{title}</h4>
        <FooterLinks links={links} />
      </div>

      <details className="ic-footer-mobile-group">
        <summary>
          <span>{title}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="ic-footer-chevron"
          />
        </summary>
        <FooterLinks links={links} />
      </details>
    </div>
  );
}

export default function Footer() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const root = document.documentElement;

    function syncLanguage() {
      const value = (root.getAttribute('lang') || 'en')
        .toLowerCase()
        .split('-')[0];

      setLang(
        Object.prototype.hasOwnProperty.call(FOOTER_TEXT, value)
          ? value
          : 'en'
      );
    }

    syncLanguage();

    const observer = new MutationObserver(syncLanguage);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['lang'],
    });

    return () => observer.disconnect();
  }, []);

  const t = FOOTER_TEXT[lang];

  const groups = [
    {
      title: t.explore,
      links: [
        { href: '/search', label: t.search },
        { href: '/#categories', label: t.categories },
        { href: '/#popular-cities', label: t.cities },
        { href: '/account/new-business', label: t.addBusiness },
      ],
    },
    {
      title: 'IranConnect',
      links: [
        { href: '/about', label: t.about },
        { href: '/#faq', label: t.faq },
      ],
    },
    {
      title: t.legal,
      links: [
        { href: '/privacy-policy', label: t.privacy },
        { href: '/terms-of-service', label: t.terms },
        { href: '/cookies', label: t.cookies },
      ],
    },
  ];

  return (
    <footer
      className="site-footer"
      style={{ paddingInline: 0 }}
      lang={lang}
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      <div className="ic-footer-inner mx-auto w-full max-w-5xl px-4 md:px-2">
        <div className="ic-footer-grid">
          <div className="ic-footer-brand">
            <img
              src="/logo-dark.png"
              alt="IranConnect"
              className="ic-footer-brand-logo"
              loading="lazy"
              decoding="async"
            />

            <p>{t.description}</p>

            <div className="ic-footer-social">
              {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                >
                  <Icon size={22} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <FooterGroup
              key={group.title}
              title={group.title}
              links={group.links}
            />
          ))}
        </div>

        <div className="ic-footer-bottom">
          <p>
            © {new Date().getFullYear()} IRANCONNECT — {t.copyright}
          </p>

          <button
            type="button"
            className="ic-footer-cookie-button"
            onClick={() => {
              window.dispatchEvent(new Event('open-cookie-settings'));
            }}
          >
            {t.cookieSettings}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .site-footer .ic-footer-inner {
          box-sizing: border-box;
        }

        .site-footer .ic-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
          gap: 32px;
        }

        .site-footer .ic-footer-brand-logo {
          display: block;
          width: 110px;
          max-width: 100%;
          height: auto;
          object-fit: contain;
          margin: 0 0 12px;
        }

        .site-footer .ic-footer-brand p {
          font-size: 14px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          text-align: justify;
          text-align-last: start;
          overflow-wrap: break-word;
        }

        .site-footer .ic-footer-social {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 12px;
        }

        .site-footer .ic-footer-social a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 36px;
          color: #00bfa6;
          border-radius: 6px;
        }

        .site-footer .ic-footer-group h4,
        .site-footer .ic-footer-mobile-group summary {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
        }

        .site-footer .ic-footer-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .site-footer .ic-footer-links a {
          display: inline-block;
          font-size: 14px;
          line-height: 1.6;
          padding-block: 4px;
          overflow-wrap: anywhere;
          color: #2dd4bf;
        }

        .site-footer .ic-footer-social a:hover,
        .site-footer .ic-footer-links a:hover,
        .site-footer .ic-footer-cookie-button:hover {
          color: #fff;
        }

        .site-footer .ic-footer-mobile-group {
          display: none;
        }

        .site-footer .ic-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px 24px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.75);
          font-size: 13px;
        }

        .site-footer .ic-footer-bottom p {
          margin: 0;
        }

        .site-footer .ic-footer-cookie-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 0;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          text-decoration: underline;
        }

        .site-footer a:focus-visible,
        .site-footer button:focus-visible,
        .site-footer summary:focus-visible {
          outline: 2px solid #2dd4bf;
          outline-offset: 4px;
          border-radius: 3px;
        }

        @media (min-width: 1024px) {
          .site-footer .ic-footer-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            align-items: stretch;
            gap: 32px;
          }

          .site-footer .ic-footer-grid > * {
            position: relative;
            min-width: 0;
            align-self: stretch;
          }

          .site-footer .ic-footer-brand {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
          }

          .site-footer .ic-footer-group {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
          }

          .site-footer .ic-footer-desktop-group {
            width: 100%;
            margin: 0;
            padding: 0;
          }

          .site-footer .ic-footer-desktop-group h4 {
            margin-top: 0;
          }

          .site-footer .ic-footer-brand p {
            width: 100%;
            font-size: 13px;
            line-height: 1.75;
            text-align: justify;
            text-align-last: start;
            text-justify: inter-word;
            word-spacing: normal;
            letter-spacing: normal;
            hyphens: auto;
            text-wrap: pretty;
          }

          .site-footer .ic-footer-grid > *:not(:first-child)::before {
            content: '';
            position: absolute;
            inset-inline-start: -16px;
            top: 0;
            bottom: 0;
            width: 1px;
            background: rgba(255, 255, 255, 0.16);
            pointer-events: none;
          }

          .site-footer .ic-footer-brand-logo {
            margin-top: -8px;
            margin-bottom: 8px;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .site-footer .ic-footer-brand-logo {
            width: 120px;
          }

          .site-footer .ic-footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 32px;
          }
        }

        @media (max-width: 639px) {
          .site-footer .ic-footer-brand-logo {
            width: 130px;
          }

          .site-footer .ic-footer-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0;
          }

          .site-footer .ic-footer-brand {
            padding-bottom: 24px;
          }

          .site-footer .ic-footer-desktop-group {
            display: none;
          }

          .site-footer .ic-footer-mobile-group {
            display: block;
            border-top: 1px solid rgba(255,255,255,0.15);
          }

          .site-footer .ic-footer-mobile-group summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            cursor: pointer;
            min-height: 48px;
            padding-block: 12px;
            margin: 0;
            list-style: none;
          }

          .site-footer .ic-footer-mobile-group summary::-webkit-details-marker {
            display: none;
          }

          .site-footer .ic-footer-mobile-group[open] .ic-footer-chevron {
            transform: rotate(180deg);
          }

          .site-footer .ic-footer-mobile-group .ic-footer-links {
            padding-bottom: 16px;
          }

          .site-footer .ic-footer-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-top: 16px;
          }
        }
      `}</style>
    </footer>
  );
}
