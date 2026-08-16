import React from 'react';
import { Flame, Baby, Scissors, Laptop, WheatOff, Sun } from 'lucide-react';
import { Card } from './ui/card';
import { activitiesContent } from '../data/mock';
import { useSiteText } from '../hooks/useSiteText';

const iconMap = {
  flame:     <Flame    className="w-8 h-8" />,
  baby:      <Baby     className="w-8 h-8" />,
  scissors:  <Scissors className="w-8 h-8" />,
  laptop:    <Laptop   className="w-8 h-8" />,
  'wheat-off': <WheatOff className="w-8 h-8" />,
  sun:         <Sun      className="w-8 h-8" />,
};

const Activities = () => {
  const { t } = useSiteText();
  return (
    <section id="aktiviteter" data-testid="activities-section" className="py-24 bg-[#e8dcc8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-4">
            <Flame className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            data-testid="activities-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('act_title', activitiesContent.title)}
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('act_subtitle', activitiesContent.subtitle)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activitiesContent.activities.map((activity, index) => (
            <Card
              key={index}
              data-testid={`activity-card-${index}`}
              className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-[#eaf3fb] border-none group"
            >
              <div className="text-[#3d7ea6] mb-4 group-hover:scale-110 transition-transform duration-300">
                {iconMap[activity.icon]}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t(`act_${index}_title`, activity.title)}
              </h3>
              <p className="text-gray-600">
                {t(`act_${index}_desc`, activity.description)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Activities;
