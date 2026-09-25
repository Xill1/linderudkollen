import { useState, useEffect } from 'react';
import { getSiteImages } from '../lib/db';

export function useSiteImages() {
  const [images, setImages] = useState({});
  const [focusMap, setFocusMap] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSiteImages()
      .then(data => {
        if (cancelled) return;
        const imgMap = {};
        const fMap = {};
        (data?.slots || []).forEach(s => {
          if (s.url) imgMap[s.id] = s.url;
          fMap[s.id] = { x: s.focus_x ?? 50, y: s.focus_y ?? 50 };
        });
        setImages(imgMap);
        setFocusMap(fMap);
        setReady(true);
      })
      .catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const img = (slotId, fallback) => ready ? (images[slotId] || fallback) : null;
  const focus = (slotId) => {
    const f = focusMap[slotId];
    return f ? `${f.x}% ${f.y}%` : '50% 50%';
  };

  return { img, focus };
}
