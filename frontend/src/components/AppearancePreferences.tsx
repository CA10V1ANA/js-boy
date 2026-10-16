import { Globe2, Moon, Sun } from 'lucide-react';
import { message, useLocale } from '../i18n';
import { isLocale, setLocale, setTheme, useTheme } from '../preferences';

export function AppearancePreferences() {
  const locale = useLocale();
  const theme = useTheme();
  return (
    <div className="appearancePreferences" role="group" aria-label={message('preferencias.titulo')}>
      <label className="languagePreference">
        <Globe2 size={17} aria-hidden="true" />
        <span className="srOnly">{message('preferencias.idioma')}</span>
        <select value={locale} onChange={event => { if (isLocale(event.target.value)) setLocale(event.target.value); }}>
          <option value="pt-BR" lang="pt-BR">Português</option>
          <option value="en" lang="en">English</option>
          <option value="es" lang="es">Español</option>
        </select>
      </label>
      <button type="button" className="themePreference" aria-label={message('preferencias.tema.escuro')} aria-pressed={theme === 'dark'} title={message(theme === 'dark' ? 'preferencias.usar.tema.claro' : 'preferencias.usar.tema.escuro')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
