import React from 'react';
import { Wheat, Clock, Users, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { aboutContent } from '../data/mock';
import { useSiteImages } from '../hooks/useSiteImages';
import { useSiteText } from '../hooks/useSiteText';

const iconMap = {
  bread: <Wheat className="w-8 h-8" />,
  clock: <Clock className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  mapPin: <MapPin className="w-8 h-8" />,
};

const About = () => {
  const { img } = useSiteImages();
  const { t } = useSiteText();
  return (
    <section id="om-oss" data-testid="about-section" className="py-24 bg-[#f0e8d8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            data-testid="about-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('about_title', aboutContent.title)}
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-8"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 md:order-1">
            <div className="prose prose-lg">
              {aboutContent.paragraphs.map((p, i) => (
                <p key={i} className="text-gray-700 text-lg leading-relaxed mb-6">
                  {t(`about_p${i}`, p)}
                </p>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={img('om_oss_bilde', aboutContent.image)}
              alt="Koselig interiør med peis"
              data-testid="about-image"
              loading="lazy"
              className="rounded-2xl shadow-2xl w-full h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aboutContent.features.map((feature, index) => (
            <Card
              key={index}
              data-testid={`about-feature-${index}`}
              className="p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-[#eaf3fb] border-none"
            >
              <div className="text-[#3d7ea6] mb-4">{iconMap[feature.icon]}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t(`about_feat_${index}_title`, feature.title)}
              </h3>
              <p className="text-gray-600">
                {t(`about_feat_${index}_desc`, feature.description)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
