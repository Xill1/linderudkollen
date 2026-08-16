import React, { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Facebook } from 'lucide-react';
import { siteInfo } from '../data/mock';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/gallery`)
      .then(r => r.json())
      .then(data => { setImages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openLightbox = (index) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox(i => (i > 0 ? i - 1 : images.length - 1));
  const nextImage = () => setLightbox(i => (i < images.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handleKey = (e) => {
      if (lightbox === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox]);

  if (loading) return null;

  if (images.length === 0) return (
    <section id="galleri" className="py-24 bg-gradient-to-b from-white to-amber-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Camera className="w-12 h-12 text-amber-300 mx-auto mb-4" />
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Bildegalleri
        </h2>
        <div className="w-24 h-1 bg-amber-200 mx-auto mb-8" />
        <div className="bg-amber-50 border border-amber-100 rounded-3xl px-8 py-12 max-w-lg mx-auto">
          <p className="text-gray-600 mb-2 text-lg font-medium">Bilder lastes inn snart</p>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Vi er i ferd med å fylle galleriet med bilder fra Linderudkollen og Lillomarka.
            Følg oss på Facebook for de nyeste bildene.
          </p>
          <a
            href={siteInfo.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <Facebook className="w-4 h-4" />
            Se bilder på Facebook
          </a>
        </div>
      </div>
    </section>
  );

  return (
    <section id="galleri" data-testid="gallery-section" className="py-24 bg-gradient-to-b from-white to-amber-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-4">
            <Camera className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            data-testid="gallery-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Bildegalleri
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bilder fra Linderudkollen og Lillomarka
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              data-testid={`gallery-image-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => openLightbox(index)}
            >
              <img
                src={`${API_URL}/api/gallery/image/${img.id}`}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                <div className="p-3 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium truncate">{img.title}</p>
                  {img.description && <p className="text-white/80 text-xs truncate">{img.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          data-testid="gallery-lightbox"
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-6 right-6 text-white/80 hover:text-white z-10"
            data-testid="lightbox-close"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 text-white/80 hover:text-white z-10"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 text-white/80 hover:text-white z-10"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="max-w-5xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${API_URL}/api/gallery/image/${images[lightbox].id}`}
              alt={images[lightbox].title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <p className="text-white text-lg font-medium">{images[lightbox].title}</p>
              {images[lightbox].description && (
                <p className="text-white/70 text-sm mt-1">{images[lightbox].description}</p>
              )}
              <p className="text-white/50 text-xs mt-2">{lightbox + 1} / {images.length}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
