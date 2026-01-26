import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TridaDetail from './pages/TridaDetail'
import ZakHodnoceni from './pages/ZakHodnoceni'
import AdminUzivatele from './pages/AdminUzivatele'
import AdminTridy from './pages/AdminTridy'

// Chráněná routa - vyžaduje přihlášení
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vilekula-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin routa - vyžaduje admin roli
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vilekula-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="trida/:tridaId" element={<TridaDetail />} />
        <Route path="zak/:zakId/hodnoceni" element={<ZakHodnoceni />} />
        
        {/* Admin routes */}
        <Route path="admin/uzivatele" element={
          <AdminRoute><AdminUzivatele /></AdminRoute>
        } />
        <Route path="admin/tridy" element={
          <AdminRoute><AdminTridy /></AdminRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
