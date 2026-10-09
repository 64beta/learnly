// Uşaq rejimi bu cihazda aktiv olduqda valideyn səhifələri bağlanır və
// yalnız PIN ilə açılır.
const KEY = 'learnly.childMode'

export function getChildMode(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setChildMode(childId: string) {
  try {
    localStorage.setItem(KEY, childId)
  } catch {
    /* brauzer yaddaşı əlçatan deyil */
  }
}

export function clearChildMode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* brauzer yaddaşı əlçatan deyil */
  }
}
