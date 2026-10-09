import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { homePathFor, useAuth } from '../auth/AuthProvider'
import { getChildMode } from '../lib/childMode'
import type { Role } from '../lib/types'
import { Alert, Button, PageSpinner } from './ui'

/**
 * Rol yoxlaması. Uşaq rejimi aktivdirsə, valideyn səhifələri əvəzinə
 * uşaq ekranına yönləndirir (çıxış yalnız PIN ilə).
 */
export function RequireRole({ role, children }: { role?: Role; children: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) {
    // Profil sətri yoxdursa (məs. SQL trigger quraşdırılmayıb) — əbədi spinner əvəzinə izah
    return (
      <div className="mx-auto max-w-md p-6">
        <Alert tone="berry">Profile not found. Check that supabase/migrations/0001_schema.sql was applied, then sign in again.</Alert>
        <Button className="mt-4" variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    )
  }

  const childMode = getChildMode()
  if (childMode && profile.role === 'parent' && !location.pathname.startsWith('/play')) {
    return <Navigate to={`/play/${childMode}`} replace />
  }
  if (role && profile.role !== role) return <Navigate to={homePathFor(profile)} replace />
  return <>{children}</>
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (session && profile) return <Navigate to={homePathFor(profile)} replace />
  return <>{children}</>
}
