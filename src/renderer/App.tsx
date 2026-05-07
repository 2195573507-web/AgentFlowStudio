import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

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
        <span className="text-sm text-[var(--text-tertiary)]">Loading...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/prompts" element={<PromptLab />} />
          <Route path="/prompt-lab" element={<PromptLab />} />
          <Route path="/logs" element={<LogAnalyzer />} />
          <Route path="/log-analyzer" element={<LogAnalyzer />} />
          <Route path="/git" element={<GitTimeline />} />
          <Route path="/git-timeline" element={<GitTimeline />} />
          <Route path="/safety" element={<SafetyBox />} />
          <Route path="/safety-box" element={<SafetyBox />} />
          <Route path="/memory" element={<SharedMemoryHub />} />
          <Route path="/shared-memory-hub" element={<SharedMemoryHub />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
