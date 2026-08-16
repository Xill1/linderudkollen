import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function useSiteImages() {
  const [images, setImages] = useState({});
  const [focusMap, setFocusMap] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/site-images`)
      .then(r => r.ok ? r.json() : { slots: [] })
      .then(data => {
        const imgMap = {};
        const fMap = {};
        (data.slots || []).forEach(s => {
          if (s.url) imgMap[s.id] = `${API_URL}${s.url}`;
          fMap[s.id] = { x: s.focus_x ?? 50, y: s.focus_y ?? 50 };
        });
        setImages(imgMap);
        setFocusMap(fMap);
        setReady(true);
      })
      .catch(() => { setReady(true); });
  }, []);

  const img = (slotId, fallback) => ready ? (images[slotId] || fallback) : null;
  const focus = (slotId) => {
    const f = focusMap[slotId];
    return f ? `${f.x}% ${f.y}%` : '50% 50%';
  };

  return { img, focus };
}
