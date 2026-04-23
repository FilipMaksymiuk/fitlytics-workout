import { type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorkoutPage from './pages/WorkoutPage'
import HistoryPage from './pages/HistoryPage'
import ProgressPage from './pages/ProgressPage'
import PlansPage from './pages/PlansPage'
import ProfilePage from './pages/ProfilePage'
import PlanExecutionPage from './pages/PlanExecutionPage'
import Navbar from './components/Navbar'
import { AccentProvider } from './AccentContext'

function PrivateRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

const PUBLIC_PATHS = ['/login', '/register']

function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isPublic = PUBLIC_PATHS.includes(pathname)
  return (
    <>
      {!isPublic && <Navbar />}
      {children}
    </>
  )
}

function App() {
  return (
    <AccentProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
          <Route path="/plans" element={<PrivateRoute><PlansPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/plans/:id/execute" element={<PrivateRoute><PlanExecutionPage /></PrivateRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </AccentProvider>
  )
}

export default App
