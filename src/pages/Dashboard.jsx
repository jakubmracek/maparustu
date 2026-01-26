import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const [tridy, setTridy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { ucitel, isAdmin } = useAuth()

  useEffect(() => {
    loadTridy()
  }, [ucitel])

  const loadTridy = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('trida')
        .select(`
          *,
          zak:zak(count),
          ucitel_trida!inner(ucitel_id)
        `)
        .eq('aktivni', true)
        .order('rocnik')
        .order('nazev')

      // Pokud není admin, filtruj podle přiřazení
      if (!isAdmin) {
        query = query.eq('ucitel_trida.ucitel_id', ucitel.id)
      }

      const { data, error } = await query

      if (error) throw error

      // Spočítej žáky pro každou třídu
      const tridyWithCounts = await Promise.all(
        data.map(async (trida) => {
          const { count } = await supabase
            .from('zak')
            .select('*', { count: 'exact', head: true })
            .eq('trida_id', trida.id)
            .eq('aktivni', true)
          
          return { ...trida, pocet_zaku: count || 0 }
        })
      )

      setTridy(tridyWithCounts)
    } catch (err) {
      console.error('Error loading tridy:', err)
      setError('Nepodařilo se načíst třídy')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vilekula-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Přehled tříd</h1>
        <p className="mt-1 text-gray-600">
          Vyberte třídu pro zobrazení žáků a zadání hodnocení
        </p>
      </div>

      {tridy.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {isAdmin 
              ? 'Zatím nejsou vytvořeny žádné třídy. Přejděte do správy tříd a vytvořte první třídu.'
              : 'Nemáte přiřazeny žádné třídy. Kontaktujte administrátora.'}
          </p>
          {isAdmin && (
            <Link
              to="/admin/tridy"
              className="mt-4 inline-block bg-vilekula-600 text-white px-4 py-2 rounded-lg hover:bg-vilekula-700 transition"
            >
              Spravovat třídy
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tridy.map((trida) => (
            <Link
              key={trida.id}
              to={`/trida/${trida.id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border border-gray-100 hover:border-vilekula-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{trida.nazev}</h2>
                  <p className="text-gray-500 mt-1">
                    {trida.rocnik}. ročník • {trida.skolni_rok}
                  </p>
                </div>
                <span className="bg-vilekula-100 text-vilekula-700 px-3 py-1 rounded-full text-sm font-medium">
                  {trida.pocet_zaku} žáků
                </span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-vilekula-600 text-sm font-medium flex items-center">
                  Zobrazit žáky
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
