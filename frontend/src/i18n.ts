// Übersetzung der Oberfläche. Deutsch ist die Ausgangssprache: Der deutsche Text ist selbst
// der Schlüssel, tr() gibt ihn im deutschen Modus unverändert zurück.
// Englisch ist vorerst nur intern erreichbar: ?lang=en an die Adresse hängen (?lang=de schaltet zurück).
import en from './locales/en'

export type Lang = 'de' | 'en'

function detectLang(): Lang {
  try {
    const param = new URLSearchParams(window.location.search).get('lang')
    if (param === 'en') localStorage.setItem('aipo_lang', 'en')
    if (param === 'de') localStorage.removeItem('aipo_lang')
    return localStorage.getItem('aipo_lang') === 'en' ? 'en' : 'de'
  } catch {
    return 'de'
  }
}

export const lang: Lang = detectLang()
export const locale = lang === 'en' ? 'en-US' : 'de-DE'

const dict: Record<string, string> = lang === 'en' ? en : {}

export function tr(text: string, vars?: Record<string, string | number | boolean | null | undefined>): string {
  let s = dict[text] ?? text
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
  return s
}
