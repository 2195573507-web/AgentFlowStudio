import React, { Suspense, lazy } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './lib/auth'
import { hasPermission, type Permission } from './lib/permissions'

const Login = lazy(() => import('./routes/Login'))
const Dashboard = lazy(() => import('./routes/Dashboard'))
const Workflows = lazy(() => import('./routes/Workflows'))
const Projects = lazy(() => import('./routes/Projects'))
const ProjectDetail = lazy(() => import('./routes/ProjectDetail'))
const PromptLab = lazy(() => import('./routes/PromptLab'))
const LogAnalyzer = lazy(() => import('./routes/LogAnalyzer'))
const GitTimeline = lazy(() => import('./routes/GitTimeline'))
const SafetyBox = lazy(() => import('./routes/SafetyBox'))
const SharedMemoryHub = lazy(() => import('./routes/SharedMemoryHub'))
const Skills = lazy(() => import('./routes/Skills'))
const Settings = lazy(() => import('./routes/Settings'))
const AdminUsers = lazy(() => import('./routes/AdminUsers'))
const AdminAudit = lazy(() => import('./routes/AdminAudit'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--text-tertiary)]">正在加载...</span>
      </div>
    </div>
  )
}

function routeElement(name: string, element: React.ReactNode) {
  return <ErrorBoundary routeName={name}>{element}</ErrorBoundary>
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Layout>{children}</Layout>
}

function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!hasPermission(user, permission)) {
    return (
      <div className="p-6">
        <div className="liquid-glass-card p-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access denied</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This route requires {permission}.</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function ForcePasswordChange({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth()
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [error, setError] = React.useState('')
  if (!user?.mustChangePassword) return <>{children}</>
  const change = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const { api } = await import('./lib/api')
    const result = await api.auth.changePassword({ currentPassword, newPassword })
    if (result && typeof result === 'object' && 'error' in result) {
      setError(String(result.error))
      return
    }
    setUser(result)
  }
  return (
    <div className="min-h-screen w-screen p-6 flex items-center justify-center">
      <form onSubmit={change} className="liquid-glass-card w-full max-w-md p-5 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Change default password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">The bootstrap admin password is intentionally weak and must be replaced before using the workspace.</p>
        <input aria-label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] px-3 py-2 text-sm" />
        <input aria-label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="w-full rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white">Update password</button>
      </form>
    </div>
  )
}

function AppRoutes() {
  return (
    <ForcePasswordChange>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={routeElement('Login', <Login />)} />
          <Route path="/" element={routeElement('Dashboard', <Dashboard />)} />
          <Route path="/workflows" element={routeElement('Workflows', <Workflows />)} />
          <Route path="/projects" element={routeElement('Projects', <Projects />)} />
          <Route path="/projects/:id" element={routeElement('Project Detail', <ProjectDetail />)} />
          <Route path="/prompts" element={routeElement('Prompt Lab', <PromptLab />)} />
          <Route path="/prompt-lab" element={routeElement('Prompt Lab', <PromptLab />)} />
          <Route path="/logs" element={routeElement('Log Analyzer', <LogAnalyzer />)} />
          <Route path="/log-analyzer" element={routeElement('Log Analyzer', <LogAnalyzer />)} />
          <Route path="/git" element={routeElement('Git Timeline', <GitTimeline />)} />
          <Route path="/git-timeline" element={routeElement('Git Timeline', <GitTimeline />)} />
          <Route path="/safety" element={routeElement('SafetyBox', <SafetyBox />)} />
          <Route path="/safety-box" element={routeElement('SafetyBox', <SafetyBox />)} />
          <Route path="/memory" element={routeElement('Shared Memory Hub', <SharedMemoryHub />)} />
          <Route path="/shared-memory-hub" element={routeElement('Shared Memory Hub', <SharedMemoryHub />)} />
          <Route path="/skills" element={routeElement('Skills', <Skills />)} />
          <Route path="/admin/users" element={routeElement('Admin Users', <RequirePermission permission="admin:users"><AdminUsers /></RequirePermission>)} />
          <Route path="/admin/audit" element={routeElement('Audit Logs', <RequirePermission permission="admin:audit"><AdminAudit /></RequirePermission>)} />
          <Route path="/settings" element={routeElement('Settings', <Settings />)} />
        </Routes>
      </Suspense>
    </ForcePasswordChange>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={routeElement('Login', <Login />)} />
          <Route path="/*" element={<ProtectedShell><AppRoutes /></ProtectedShell>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
