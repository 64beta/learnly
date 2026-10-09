import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import i18n, { changeLocale } from '../i18n'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  // Profilin hansı istifadəçi üçün yükləndiyi: sessiya dəyişən an ilə profilin
  // gəldiyi an arasında "yüklənir" vəziyyəti saxlanılır.
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    // Callback-də başqa supabase çağırışı etmirik (deadlock riski); yalnız state yeniləyirik.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setLoadedFor(null)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    const p = (data as Profile | null) ?? null
    setProfile(p)
    setLoadedFor(userId)
    if (p?.locale && p.locale !== i18n.language) changeLocale(p.locale)
  }, [userId])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const signOut = useCallback(async () => {
    // scope: 'local' — yalnız bu brauzerdən çıxış; eyni hesabın digər sessiyaları ölmür
    await supabase.auth.signOut({ scope: 'local' })
    setProfile(null)
  }, [])

  const loading = !sessionReady || (userId !== null && loadedFor !== userId)

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile: loadProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function homePathFor(profile: Profile | null) {
  if (!profile) return '/'
  return profile.role === 'teacher' ? '/t' : '/app'
}
