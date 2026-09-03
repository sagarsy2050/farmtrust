import { useTranslation } from 'react-i18next';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { INDIAN_LANGUAGES } from '@/lib/indianLanguages';

// A plain <select> rather than pulling in a new dropdown-menu primitive
// this codebase doesn't otherwise use - 22 languages read fine as a native
// select, and it's free screen-reader/keyboard behavior.
export default function LanguageSelector({ className = '' }) {
  const { i18n, t } = useTranslation();
  const { user, checkUserAuth } = useAuth();

  const handleChange = async (e) => {
    const code = e.target.value;
    i18n.changeLanguage(code);
    if (user?.id) {
      try {
        await api.entities.User.update(user.id, { preferred_language: code });
        await checkUserAuth();
      } catch {
        // Non-fatal: the UI already switched language; syncing the
        // preference to the server can be retried next change.
      }
    }
  };

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      aria-label={t('language.select')}
      className={`rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {INDIAN_LANGUAGES.map(l => (
        <option key={l.code} value={l.code}>{l.native}</option>
      ))}
    </select>
  );
}
