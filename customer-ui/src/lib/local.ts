import type { Lang, QRDSession } from "@/lib/types";

// Temporary QR session store — the customer panel runs on a temporary session code.
const SESSION_KEY = "qrd_session";
const LANG_KEY = "qrd_lang";
const CART_KEY = "qrd_cart";

export function getSession(): QRDSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as QRDSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: QRDSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  saveLanguage(s.language);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LANG_KEY);
  localStorage.removeItem(CART_KEY);
}

export function getLanguage(): Lang {
  return (localStorage.getItem(LANG_KEY) as Lang) || "en";
}

export function saveLanguage(l: Lang) {
  localStorage.setItem(LANG_KEY, l);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
