import React from 'react';
import { MapPin, ExternalLink, TreePine } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { skiMapContent } from '../data/mock';

const SkiMap = () => {
  return (
    <section id="lopekart" data-testid="skimap-section" className="py-24 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <TreePine className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            data-testid="skimap-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {skiMapContent.title}
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {skiMapContent.subtitle}
          </p>
        </div>

        <Card className="overflow-hidden shadow-2xl border-none">
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-white text-xl font-semibold">{skiMapContent.credit}</h3>
                  <p className="text-amber-200 text-sm">{skiMapContent.creditDescription}</p>
                </div>
              </div>
              <Button
                data-testid="skimap-external-link"
                onClick={() => window.open(skiMapContent.externalUrl, '_blank')}
                className="bg-white text-amber-900 hover:bg-amber-50 font-semibold shadow-lg"
              >
                Stort kart
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="relative bg-gray-100" style={{ height: '600px' }}>
            <iframe
              src={skiMapContent.embedUrl}
              title="Løypekart for Linderudkollen"
              data-testid="skimap-iframe"
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Kartet er levert av{' '}
            <a
              href={skiMapContent.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-800 font-semibold underline"
            >
              {skiMapContent.credit}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SkiMap;
