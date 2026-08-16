import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { heroContent } from '../data/mock';
import { useSiteImages } from '../hooks/useSiteImages';
import { useSiteText } from '../hooks/useSiteText';

const Hero = () => {
  const navigate = useNavigate();
  const { img } = useSiteImages();
  const { t } = useSiteText();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const bgUrl = img('hero_bakgrunn', '/hero.jpg');

  return (
    <div id="hjem" data-testid="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundPosition: 'center 32%',
          opacity: bgUrl ? 1 : 0,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Linderudkollen Sportsstue"
              className="h-44 md:h-56 w-auto drop-shadow-2xl"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>

          <h1
            data-testid="hero-heading"
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8), 0 8px 60px rgba(0,0,0,0.7)' }}
          >
            {heroContent.heading}
          </h1>

          <p data-testid="hero-subheading" className="text-xl md:text-2xl text-amber-200 mb-4 max-w-3xl mx-auto font-medium">
            {t('hero_subheading', heroContent.subheading)}
          </p>

          <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('hero_description', heroContent.description)}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              data-testid="hero-cta-primary"
              onClick={() => scrollToSection('apningstider')}
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {heroContent.ctaPrimary}
            </Button>
            <Button
              size="lg"
              variant="outline"
              data-testid="hero-cta-secondary"
              onClick={() => navigate('/meny')}
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-amber-900 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {heroContent.ctaSecondary}
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <div className="w-6 h-10 border-2 border-white/70 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
