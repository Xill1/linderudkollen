import React, { useState, useEffect } from 'react';
import { Coffee, Wheat, Soup, Apple, Leaf, CupSoda } from 'lucide-react';
import { Card } from './ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryIcons = {
  'Bakst': <Wheat className="w-6 h-6" />,
  'Varm mat': <Soup className="w-6 h-6" />,
  'Drikke': <Coffee className="w-6 h-6" />,
  'Spesielt': <Leaf className="w-6 h-6" />,
};

const Menu = () => {
  const [menuData, setMenuData] = useState(null);
  const [categoryOrder, setCategoryOrder] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/menu`)
      .then(r => r.json())
      .then(setMenuData)
      .catch(() => {});
    fetch(`${API_URL}/api/menu/categories`)
      .then(r => r.json())
      .then(cats => setCategoryOrder(cats.map(c => c.name)))
      .catch(() => {});
  }, []);

  if (!menuData || Object.keys(menuData.categories || {}).length === 0) return null;

  const sortedCategories = Object.keys(menuData.categories).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <section id="meny" data-testid="menu-section" className="py-24 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-4">
            <Coffee className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            data-testid="menu-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Meny
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Alt laget fra bunnen, på huset
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          {sortedCategories.map((category) => (
            <div key={category} data-testid={`menu-category-${category.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="text-amber-700">
                  {categoryIcons[category] || <CupSoda className="w-6 h-6" />}
                </div>
                <h3
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {category}
                </h3>
                <div className="flex-1 h-px bg-amber-200 ml-3"></div>
              </div>

              <div className="space-y-3">
                {menuData.categories[category]
                  .filter(item => item.is_available)
                  .map((item) => (
                  <Card
                    key={item.id}
                    data-testid={`menu-item-${item.id}`}
                    className="p-4 md:p-5 border-none shadow-sm hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.price != null && (
                        <span className="text-amber-800 font-bold text-lg whitespace-nowrap">
                          {item.price},- kr
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Menu;
