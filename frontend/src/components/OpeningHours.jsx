import React, { useState, useEffect } from 'react';
import { Clock, Facebook, Info, MapPin, CheckCircle } from 'lucide-react';
import { siteInfo, defaultOpeningHours } from '../data/mock';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getNorwegianToday = () => {
  const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  return days[new Date().getDay()];
};

const OpeningHours = () => {
  const [data, setData] = useState(defaultOpeningHours);
  const today = getNorwegianToday();

  useEffect(() => {
    fetch(`${API_URL}/api/opening-hours`)
      .then(r => r.json())
      .then(d => { if (d?.schedule) setData(d); })
      .catch(() => {});
  }, []);

  return (
    <section id="apningstider" data-testid="opening-hours-section" className="py-24 bg-[#f0e8d8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-4">
            <Clock className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            data-testid="opening-hours-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Åpningstider
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-5" />
          <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            {data.period}
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">

          {/* Schedule */}
          <div className="md:col-span-3 bg-[#eaf3fb] rounded-3xl shadow-md border border-[#bdd4e8] p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Ukeplan</h3>
            <div className="divide-y divide-[#d7e6f3]">
              {data.schedule.map((item, index) => {
                const isToday = item.day === today;
                return (
                  <div
                    key={index}
                    data-testid={`schedule-${item.day.toLowerCase()}`}
                    className={`flex justify-between items-center py-3.5 px-3 -mx-3 rounded-xl transition-colors ${
                      isToday ? 'bg-[#deeaf6]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isToday && <div className="w-2 h-2 rounded-full bg-[#3d7ea6]" />}
                      {!isToday && <div className="w-2 h-2" />}
                      <span className={`font-semibold ${
                        isToday ? 'text-[#2f6690]' : item.closed ? 'text-gray-300' : 'text-gray-800'
                      }`}>
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="text-xs bg-[#3d7ea6] text-white px-2 py-0.5 rounded-full font-medium">
                          i dag
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      isToday ? 'text-[#3d7ea6]' : item.closed ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {item.hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 flex flex-col gap-5">

            {/* Practical info */}
            <div className="bg-[#e8dcc8] rounded-3xl border border-[#d8ccb4] p-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800/60 mb-5">Praktisk info</h3>
              <ul className="space-y-4">
                {data.notices.map((notice, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm leading-relaxed">{notice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Facebook CTA */}
            <a
              href={siteInfo.facebook}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="facebook-link-hours"
              className="group flex items-center gap-4 p-5 bg-[#faf5ee] hover:bg-[#f0e8d8] border border-[#d8ccb4] rounded-3xl shadow-sm transition-all"
            >
              <div className="w-11 h-11 bg-[#1877F2] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm group-hover:text-amber-800 transition-colors">
                  Følg oss på Facebook
                </p>
                <p className="text-gray-400 text-xs mt-0.5">For oppdaterte tider og nyheter</p>
              </div>
            </a>

          </div>
        </div>

      </div>
    </section>
  );
};

export default OpeningHours;
