import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { az } from './az'
import { en } from './en'
import { ru } from './ru'
import type { Locale } from '../lib/types'

const KEY = 'learnly.lang'
export const LOCALES: Locale[] = ['az', 'en', 'ru']
export const LOCALE_LABEL: Record<Locale, string> = { az: 'AZ', en: 'EN', ru: 'RU' }

function savedLocale(): Locale {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'az' || v === 'en' || v === 'ru') return v
  } catch {
    /* brauzer yaddaşı əlçatan deyil */
  }
  return 'az'
}

void i18n.use(initReactI18next).init({
  resources: { az: { translation: az }, en: { translation: en }, ru: { translation: ru } },
  lng: savedLocale(),
  fallbackLng: 'az',
  interpolation: { escapeValue: false },
})

export function changeLocale(locale: Locale) {
  void i18n.changeLanguage(locale)
  document.documentElement.lang = locale
  try {
    localStorage.setItem(KEY, locale)
  } catch {
    /* brauzer yaddaşı əlçatan deyil */
  }
}

export default i18n
