import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { navLinks, siteInfo } from '../data/mock';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (link) => {
    setMenuOpen(false);
    if (link.path) {
      navigate(link.path);
    } else if (window.location.pathname === '/') {
      document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  };

  return (
    <>
      <nav
        data-testid="navbar"
        className={`fixed w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#f0e8d8]/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.08)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between h-20 lg:h-[4.5rem]">

            <button
              data-testid="navbar-logo"
              onClick={() => navigate('/')}
              className="flex items-center shrink-0"
            >
              <img
                src="/logo.png"
                alt="Linderudkollen Sportsstue"
                className="h-16 w-auto transition-all duration-300"
                style={{
                  filter: scrolled
                    ? 'none'
                    : 'brightness(0) invert(1)',
                }}
              />
            </button>

            <div className="hidden lg:flex items-center gap-7">
              {navLinks.map(link => (
                <button key={link.id} data-testid={`nav-link-${link.id}`} onClick={() => go(link)}
                  className={`text-[0.7rem] font-bold uppercase tracking-[0.15em] transition-colors duration-200 hover:text-amber-700 ${scrolled ? 'text-gray-600' : 'text-white/85'}`}>
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-5 shrink-0">
              <a href={`tel:${siteInfo.phoneRaw}`}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-amber-700 ${scrolled ? 'text-gray-500' : 'text-white/70'}`}>
                <Phone className="w-3.5 h-3.5" />
                {siteInfo.phone}
              </a>
            </div>

            <button
              data-testid="mobile-menu-toggle"
              onClick={() => setMenuOpen(true)}
              className={`lg:hidden p-2 -mr-1 rounded-xl transition-colors ${scrolled ? 'text-gray-700 hover:bg-[#e8dcc8]' : 'text-white hover:bg-white/10'}`}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Portal: renders directly in document.body — no stacking context issues */}
      {menuOpen && createPortal(
        <div data-testid="mobile-menu" className="fixed inset-0 z-[9999] lg:hidden">
          {/* Dark overlay background */}
          <div className="absolute inset-0 bg-amber-950" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-10 w-56 h-56 bg-amber-800/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Linderudkollen Sportsstue"
                  className="h-12 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col justify-center px-7 space-y-1">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  data-testid={`mobile-nav-link-${link.id}`}
                  onClick={() => go(link)}
                  className={`text-left py-4 border-b border-white/10 transition-all duration-150
                    hover:text-amber-300 hover:pl-2
                    ${link.path ? 'text-amber-400' : 'text-white'}`}
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.4rem, 5vw, 1.9rem)', fontWeight: 700 }}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Bottom contact info */}
            <div className="px-7 pb-10 pt-6 border-t border-white/10 space-y-2">
              <a href={`tel:${siteInfo.phoneRaw}`}
                className="flex items-center gap-2 text-white/60 text-sm hover:text-amber-300 transition-colors">
                <Phone className="w-4 h-4" />
                {siteInfo.phone}
              </a>
              <p className="text-white/30 text-xs">{siteInfo.address.line1} · {siteInfo.address.line2}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Navbar;
