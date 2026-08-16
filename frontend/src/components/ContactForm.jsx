import React from 'react';
import { Phone, Mail, MapPin, Facebook } from 'lucide-react';
import { siteInfo } from '../data/mock';

const ContactForm = () => {
  return (
    <section id="kontakt" data-testid="contact-section" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2
            data-testid="contact-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Kontakt oss
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto" />
        </div>

        <div className="bg-gradient-to-br from-amber-800 to-amber-900 rounded-3xl p-8 md:p-10 text-white shadow-xl">
          <div className="grid sm:grid-cols-2 gap-6">
            <a href={`tel:${siteInfo.phoneRaw}`}
              className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
              <div className="w-11 h-11 bg-amber-600/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-200 text-xs font-medium uppercase tracking-wider mb-0.5">Telefon</p>
                <p className="font-semibold text-white">{siteInfo.phone}</p>
              </div>
            </a>

            <a href={`mailto:${siteInfo.email}`}
              className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
              <div className="w-11 h-11 bg-amber-600/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-200 text-xs font-medium uppercase tracking-wider mb-0.5">E-post</p>
                <p className="font-semibold text-white break-all">{siteInfo.email}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl">
              <div className="w-11 h-11 bg-amber-600/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-200 text-xs font-medium uppercase tracking-wider mb-0.5">Adresse</p>
                <p className="font-semibold text-white">{siteInfo.address.line1}</p>
                <p className="text-amber-200 text-sm">{siteInfo.address.line2}</p>
              </div>
            </div>

            <a href={siteInfo.facebook} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-white/10 hover:bg-blue-600/60 rounded-2xl transition-colors">
              <div className="w-11 h-11 bg-amber-600/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-200 text-xs font-medium uppercase tracking-wider mb-0.5">Facebook</p>
                <p className="font-semibold text-white">Følg oss</p>
              </div>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/15 text-center">
            <p className="text-amber-200 text-sm">Bestyrere: <span className="text-white font-medium">{siteInfo.owners}</span></p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ContactForm;
