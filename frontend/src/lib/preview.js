// Midlertidig sperre mens nettsiden bygges: besøkende ser bare "snart ferdig"-siden.
// Dette er en enkel klientsperre for testing, ikke sikkerhet. Fjern når siden lanseres.
const KEY = 'lk_preview_unlocked';
const CODE = '1736';

export const PREVIEW_GATE_ENABLED = true;

export function isSiteUnlocked() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function unlockSite(code) {
  if (String(code).trim() !== CODE) return false;
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  return true;
}
