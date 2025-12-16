//components/Footer.jsx
'use client';

import Link from 'next/link';
import {
  Instagram,
  Facebook,
  Twitter,
  Send,
  Linkedin
} from 'lucide-react';

export default function Footer() {
  const cookieTexts = {
    en: 'Change cookie settings',
    fr: 'Modifier les cookies',
    fa: 'تغییر تنظیمات کوکی‌ها',
  };

  // 🌍 language detection (non-sensitive)
  const lang =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('lang') || 'en'
      : 'en';

  return (
    <footer className="site-footer">
      <div className="container-mobile">
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
          {/* 🟢 Brand */}
          <div style={{ maxWidth: 420 }}>
            <h3 style={{ color: '#fff', marginBottom: 8 }}>IranConnect</h3>
            <p
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 14,
                lineHeight: '1.6',
              }}
            >
              Helping Iranians abroad find professionals and connect with their
              community.
              <br />
              <Link
                href="/about"
                className="underline text-turquoise hover:text-white transition"
              >
                About IranConnect →
              </Link>
            </p>

            {/* 🌐 Social Media */}
            <div className="flex gap-4 mt-4">
              <a
                href="https://www.instagram.com/iranconnect.0rg?igsh=aWg4eXNzZWwzdHhw&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram color="#00bfa6" size={22} />
              </a>

              <a
                href="https://www.facebook.com/share/1AgNy5a5pr/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook color="#00bfa6" size={22} />
              </a>

              <a
                href="https://x.com/iranconnectorg?s=21"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <Twitter color="#00bfa6" size={22} />
              </a>

              <a
                href="https://t.me/iranconnectcommunity"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
              >
                <Send color="#00bfa6" size={22} />
              </a>

              <a
                href="https://www.linkedin.com/in/iranconnect-community-41522039a?trk=contact-info"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin color="#00bfa6" size={22} />
              </a>
            </div>
          </div>

          {/* 🔗 Links */}
          <div>
            <h4 style={{ color: '#fff' }}>
              {lang === 'fa'
                ? 'لینک‌ها'
                : lang === 'fr'
                ? 'Liens rapides'
                : 'Quick Links'}
            </h4>

            <div className="col flex flex-col gap-1">
              <Link href="/search">Search</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/about">About</Link>
              <Link href="/auth/login">Login</Link>

              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  margin: '6px 0',
                }}
              />

              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-of-service">Terms of Service</Link>
              <Link href="/cookies">Cookies Policy</Link>
            </div>
          </div>
        </div>

        {/* 🕓 Copyright + Cookie settings */}
        <div
          style={{
            marginTop: 32,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          <p>© {new Date().getFullYear()} IranConnect</p>

          {/* ✅ GDPR-compliant: review settings, not reset */}
          <Link
            href="/cookies"
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: 14,
              color: 'rgba(255,255,255,0.85)',
              textDecoration: 'underline',
            }}
            onMouseOver={(e) => (e.target.style.color = '#00bfa6')}
            onMouseOut={(e) =>
              (e.target.style.color = 'rgba(255,255,255,0.85)')
            }
          >
            {cookieTexts[lang]}
          </Link>
        </div>
      </div>
    </footer>
  );
}
