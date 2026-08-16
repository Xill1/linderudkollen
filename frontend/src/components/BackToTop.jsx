import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 450);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Tilbake til toppen"
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-amber-700 text-white shadow-lg shadow-amber-900/30
        flex items-center justify-center
        hover:bg-amber-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/40
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
