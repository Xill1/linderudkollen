import React from 'react';
import { MapPin, Car, Navigation, ExternalLink, Bus } from 'lucide-react';

const MAPS_SEARCH = 'Linderudkollen+Sportsstue,+Oslo,+Norway';
const GOOGLE_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAPS_SEARCH}`;
const EMBED_URL = `https://maps.google.com/maps?q=${MAPS_SEARCH}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
const RUTER_URL = 'https://ruter.no/reisesok/';

const FindUs = () => {
  return (
    <section className="py-24 bg-[#e8dcc8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-4">
            <MapPin className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Du finner oss her
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-5" />
          <p className="text-gray-600 text-lg">Linderudkollen Sportsstue — sørvest i Lillomarka, Oslo</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-stretch">

          {/* Map */}
          <div className="lg:col-span-3 rounded-3xl overflow-hidden shadow-xl border border-[#d8ccb4] min-h-[380px]">
            <iframe
              title="Kart til Linderudkollen Sportsstue"
              src={EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '380px', display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info card */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Address */}
            <div className="bg-[#faf5ee] border border-[#d8ccb4] rounded-3xl p-7 flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 bg-[#E60000] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-700/70 mb-1">Adresse</p>
                  <p className="text-gray-900 font-bold text-lg leading-snug">Linderudkollen Sportsstue</p>
                  <p className="text-gray-500 text-sm">Lillomarka, Oslo</p>
                </div>
              </div>

              <div className="space-y-4 mb-7">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#e8dcc8] rounded-xl border border-[#d8ccb4] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Car className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">Bil</p>
                    <p className="text-gray-500 text-xs leading-relaxed">Stor gratis parkeringsplass rett ved inngangen. Helårsvei.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#e8dcc8] rounded-xl border border-[#d8ccb4] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Navigation className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">Til fots / ski</p>
                    <p className="text-gray-500 text-xs leading-relaxed">Sentralt knutepunkt i løypenettverket i Lillomarka.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  Åpne i Google Maps
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
                <a
                  href={RUTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#E60000] hover:bg-[#cc0000] text-white font-semibold rounded-2xl shadow-md shadow-red-100 transition-all"
                >
                  <Bus className="w-4 h-4" />
                  Planlegg kollektivrute
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default FindUs;
