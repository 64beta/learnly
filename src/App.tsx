import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './auth/AuthProvider'
import { isSupabaseConfigured } from './lib/supabase'
import { AppLayout } from './components/Layout'
import { RedirectIfAuthed, RequireRole } from './components/guards'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Card, PageSpinner } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import { Plug } from 'lucide-react'

// Daxil olduqdan sonrakı səhifələr ayrıca yüklənir (ilk açılış daha sürətli olur)
const Settings = lazy(() => import('./pages/Settings'))
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'))
const ChildWizard = lazy(() => import('./pages/parent/ChildWizard'))
const ChildDetail = lazy(() => import('./pages/parent/ChildDetail'))
const ObservationForm = lazy(() => import('./pages/parent/ObservationForm'))
const Marketplace = lazy(() => import('./pages/parent/Marketplace'))
const TeacherPublic = lazy(() => import('./pages/parent/TeacherPublic'))
const ParentRequests = lazy(() => import('./pages/parent/Requests'))
const PlayHome = lazy(() => import('./pages/play/PlayHome'))
const LessonPlayer = lazy(() => import('./pages/play/LessonPlayer'))
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherRequestView = lazy(() => import('./pages/teacher/TeacherRequestView'))
const TeacherProfileEdit = lazy(() => import('./pages/teacher/TeacherProfileEdit'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
})

function SetupNotice() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-lg">
        <h1 className="flex items-center gap-2 text-xl font-extrabold"><Plug size={22} className="text-brand-600" /> {t('setup.title')}</h1>
        <p className="mt-2 text-ink-600">{t('setup.text')}</p>
      </Card>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
                <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />

                {/* Uşaq rejimi: öz sadə görünüşü var */}
                <Route path="/play/:childId" element={<RequireRole role="parent"><PlayHome /></RequireRole>} />
                <Route path="/play/:childId/:slug" element={<RequireRole role="parent"><LessonPlayer /></RequireRole>} />

                <Route element={<RequireRole><AppLayout /></RequireRole>}>
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route element={<RequireRole role="parent"><AppLayout /></RequireRole>}>
                  <Route path="/app" element={<ParentDashboard />} />
                  <Route path="/app/children/new" element={<ChildWizard />} />
                  <Route path="/app/children/:id" element={<ChildDetail />} />
                  <Route path="/app/children/:id/edit" element={<ChildWizard />} />
                  <Route path="/app/children/:id/observe" element={<ObservationForm />} />
                  <Route path="/app/teachers" element={<Marketplace />} />
                  <Route path="/app/teachers/:teacherId" element={<TeacherPublic />} />
                  <Route path="/app/requests" element={<ParentRequests />} />
                </Route>

                <Route element={<RequireRole role="teacher"><AppLayout /></RequireRole>}>
                  <Route path="/t" element={<TeacherDashboard />} />
                  <Route path="/t/profile" element={<TeacherProfileEdit />} />
                  <Route path="/t/requests/:id" element={<TeacherRequestView />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
