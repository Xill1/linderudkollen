import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

let _cache = null;
let _promise = null;

export function useSiteText() {
  const [textMap, setTextMap] = useState(_cache || {});

  useEffect(() => {
    if (_cache) { setTextMap(_cache); return; }
    if (!_promise) {
      _promise = fetch(`${API_URL}/api/site-text`)
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}));
    }
    _promise.then(data => { _cache = data; setTextMap(data); });
  }, []);

  const t = (key, fallback = '') => textMap[key] ?? fallback;
  return { t };
}

export function invalidateSiteTextCache() {
  _cache = null;
  _promise = null;
}
