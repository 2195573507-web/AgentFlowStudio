import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

const Dashboard = lazy(() => import('./routes/Dashboard'))
const Projects = lazy(() => import('./routes/Projects'))
const ProjectDetail = lazy(() => import('./routes/ProjectDetail'))
const PromptLab = lazy(() => import('./routes/PromptLab'))
const LogAnalyzer = lazy(() => import('./routes/LogAnalyzer'))
const GitTimeline = lazy(() => import('./routes/GitTimeline'))
const SafetyBox = lazy(() => import('./routes/SafetyBox'))
const SharedMemoryHub = lazy(() => import('./routes/SharedMemoryHub'))
const Skills = lazy(() => import('./routes/Skills'))
const Settings = lazy(() => import('./routes/Settings'))

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

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={routeElement('Dashboard', <Dashboard />)} />
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
          <Route path="/settings" element={routeElement('Settings', <Settings />)} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
