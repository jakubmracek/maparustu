import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { ucitel, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo a navigace */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🦊</span>
                <span className="font-bold text-xl text-vilekula-700">Vilekula</span>
              </Link>
              
              <nav className="hidden md:flex space-x-4">
                <Link 
                  to="/" 
                  className="text-gray-600 hover:text-vilekula-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Přehled
                </Link>
                
                {isAdmin && (
                  <>
                    <Link 
                      to="/admin/tridy" 
                      className="text-gray-600 hover:text-vilekula-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Třídy
                    </Link>
                    <Link 
                      to="/admin/uzivatele" 
                      className="text-gray-600 hover:text-vilekula-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Uživatelé
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Přihlášen: </span>
                <span className="font-medium text-gray-900">
                  {ucitel?.jmeno} {ucitel?.prijmeni}
                </span>
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-vilekula-100 text-vilekula-700 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Odhlásit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            ZŠ Vilekula Teplice © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}
