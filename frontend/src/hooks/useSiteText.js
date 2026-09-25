import { useState, useEffect } from 'react';
import { getSiteText } from '../lib/db';

let _cache = null;
let _promise = null;

export function useSiteText() {
  const [textMap, setTextMap] = useState(_cache || {});

  useEffect(() => {
    if (_cache) { setTextMap(_cache); return; }
    if (!_promise) {
      _promise = getSiteText()
        .then(data => data || {})
        .catch(() => ({}));
    }
    let cancelled = false;
    _promise.then(data => { _cache = data; if (!cancelled) setTextMap(data); });
    return () => { cancelled = true; };
  }, []);

  const t = (key, fallback = '') => textMap[key] ?? fallback;
  return { t };
}

export function invalidateSiteTextCache() {
  _cache = null;
  _promise = null;
}
