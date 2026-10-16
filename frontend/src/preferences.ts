import { useSyncExternalStore } from 'react';

export type Locale = 'pt-BR' | 'en' | 'es';
export type Theme = 'light' | 'dark';
const listeners = new Set<() => void>();

function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; } // Preferences still work when browser storage is unavailable.
}

export const isLocale = (value: unknown): value is Locale => value === 'pt-BR' || value === 'en' || value === 'es';
export const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';
const storedLocale = readPreference('jsboy.locale');
const storedTheme = readPreference('jsboy.theme');
let locale: Locale = isLocale(storedLocale) ? storedLocale : 'pt-BR';
let theme: Theme = isTheme(storedTheme) ? storedTheme : 'light';

function applyPreferences() {
  document.documentElement.lang = locale;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', locale === 'pt-BR' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_US');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#15171b' : '#e9a81c');
}

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); }
  catch { console.warn('JS Boy: browser preferences could not be saved.'); }
  applyPreferences();
  listeners.forEach(listener => listener());
}

export function setLocale(value: Locale) {
  if (!isLocale(value) || value === locale) return;
  locale = value;
  persist('jsboy.locale', value);
}

export function setTheme(value: Theme) {
  if (!isTheme(value) || value === theme) return;
  theme = value;
  persist('jsboy.theme', value);
}

export const getLocale = () => locale;
export const getTheme = () => theme;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useLocale = () => useSyncExternalStore(subscribe, getLocale, () => 'pt-BR' as Locale);
export const useTheme = () => useSyncExternalStore(subscribe, getTheme, () => 'light' as Theme);

applyPreferences();
window.addEventListener('storage', event => {
  if (event.key === 'jsboy.locale' || event.key === null) {
    locale = isLocale(event.newValue) && event.key !== null ? event.newValue : 'pt-BR';
  }
  if (event.key === 'jsboy.theme' || event.key === null) {
    theme = isTheme(event.newValue) && event.key !== null ? event.newValue : 'light';
  }
  applyPreferences();
  listeners.forEach(listener => listener());
});
