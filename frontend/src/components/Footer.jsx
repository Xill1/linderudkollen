import React from 'react';
import { MapPin, Phone, Mail, Facebook, UtensilsCrossed, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { siteInfo } from '../data/mock';
import { useSiteText } from '../hooks/useSiteText';

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const { t } = useSiteText();
  const phone    = t('contact_phone',    siteInfo.phone);
  const phoneRaw = t('contact_phone_raw', siteInfo.phoneRaw);
  const email    = t('contact_email',    siteInfo.email);
  const facebook = t('contact_facebook', siteInfo.facebook);

  const scrollTo = (id) => {
    if (window.location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  };

  return (
    <footer data-testid="footer-section" className="bg-[#e0d4bc]">

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-16 pb-12">
        <div className="grid md:grid-cols-3 gap-12">

          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="Linderudkollen Sportsstue"
                data-testid="footer-logo"
                className="h-32 w-auto"
              />
            </div>
            <p className="text-gray-700 text-sm mb-1">
              Sportsstue i hjertet av Lillomarka
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Gjenåpnet valentinsdagen 2026 · Martina & Fritz
            </p>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-facebook"
              aria-label="Facebook"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d8ccb4] hover:bg-[#cfc3a8] rounded-full text-sm font-medium text-gray-800 transition-all"
            >
              <Facebook className="w-4 h-4" />
              Følg oss på Facebook
            </a>
          </div>

          {/* Nav */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
              Finn frem
            </h3>
            <nav className="space-y-3">
              {[
                { label: 'Hjem',        action: () => scrollTo('hjem')        },
                { label: 'Om oss',      action: () => scrollTo('om-oss')      },
                { label: 'Aktiviteter', action: () => scrollTo('aktiviteter') },
                { label: 'Arrangement', action: () => navigate('/arrangement') },
                { label: 'Åpningstider',action: () => scrollTo('apningstider')},
                { label: 'Kontakt',     action: () => scrollTo('kontakt')     },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left hover:translate-x-0.5 transform duration-150"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
              Kontakt
            </h3>
            <div className="space-y-3.5 mb-8">
              <a
                href={`tel:${phoneRaw}`}
                data-testid="footer-phone"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-700 flex-shrink-0" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                data-testid="footer-email"
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors break-all"
              >
                <Mail className="w-4 h-4 text-amber-700 flex-shrink-0" />
                {email}
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{siteInfo.address.line1}</p>
                  <p>{siteInfo.address.line2}</p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/meny')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-600 rounded-xl text-sm font-semibold text-white transition-all text-left shadow-md shadow-amber-200"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Se menyen
              </button>
              <button
                onClick={() => navigate('/arrangement')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#d8ccb4] hover:bg-[#cfc3a8] rounded-xl text-sm font-semibold text-gray-800 transition-all text-left"
              >
                <PartyPopper className="w-4 h-4" />
                Arrangement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#d0c4ac]">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © {year} {siteInfo.fullName}. Alle rettigheter reservert.
          </p>
          <a
            href="/admin/login"
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
