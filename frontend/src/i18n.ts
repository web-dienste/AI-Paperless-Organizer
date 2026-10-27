// Übersetzung der Oberfläche. Deutsch ist die Ausgangssprache: Der deutsche Text ist selbst
// der Schlüssel, tr() gibt ihn im deutschen Modus unverändert zurück.
// Die Sprache wird in den Einstellungen gewählt und auf dem Server gespeichert. Der Browser merkt
// sie sich zusätzlich, damit die Seite sofort in der richtigen Sprache startet (Abgleich in Layout).
import en from './locales/en'

export type Lang = 'de' | 'en'

const STORAGE_KEY = 'aipo_lang'

function detectLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'de'
  } catch {
    return 'de'
  }
}

export const lang: Lang = detectLang()
export const locale = lang === 'en' ? 'en-US' : 'de-DE'

// Merkt die Sprache im Browser und lädt neu, falls sie sich von der angezeigten unterscheidet.
export function applyLang(next: string | undefined): void {
  const target: Lang = next === 'en' ? 'en' : 'de'
  try {
    if (target === 'en') localStorage.setItem(STORAGE_KEY, 'en')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
  if (target !== lang) window.location.reload()
}

const dict: Record<string, string> = lang === 'en' ? en : {}

export function tr(text: string, vars?: Record<string, string | number | boolean | null | undefined>): string {
  let s = dict[text] ?? text
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
  return s
}
