import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function TridaDetail() {
  const { tridaId } = useParams()
  const [trida, setTrida] = useState(null)
  const [zaci, setZaci] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Aktuální školní rok a pololetí
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const skolniRok = currentMonth >= 9 
    ? `${currentYear}/${currentYear + 1 - 2000}` 
    : `${currentYear - 1}/${currentYear - 2000}`
  const pololeti = currentMonth >= 2 && currentMonth <= 8 ? 2 : 1

  useEffect(() => {
    loadData()
  }, [tridaId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Načti třídu
      const { data: tridaData, error: tridaError } = await supabase
        .from('trida')
        .select('*')
        .eq('id', tridaId)
        .single()

      if (tridaError) throw tridaError
      setTrida(tridaData)

      // Načti žáky
      const { data: zaciData, error: zaciError } = await supabase
        .from('zak')
        .select('*')
        .eq('trida_id', tridaId)
        .eq('aktivni', true)
        .order('prijmeni')
        .order('jmeno')

      if (zaciError) throw zaciError

      // Pro každého žáka spočítej statistiky hodnocení
      const zaciWithStats = await Promise.all(
        zaciData.map(async (zak) => {
          // Počet výstupů pro daný ročník
          const { count: celkemVystupu } = await supabase
            .from('vystup')
            .select('*', { count: 'exact', head: true })
            .eq('rocnik', tridaData.rocnik)
            .eq('aktivni', true)

          // Počet vyplněných hodnocení
          const { count: vyplneno } = await supabase
            .from('hodnoceni')
            .select('*', { count: 'exact', head: true })
            .eq('zak_id', zak.id)
            .eq('skolni_rok', skolniRok)
            .eq('pololeti', pololeti)
            .not('stupen', 'is', null)

          return {
            ...zak,
            celkem_vystupu: celkemVystupu || 0,
            vyplneno_hodnoceni: vyplneno || 0,
          }
        })
      )

      setZaci(zaciWithStats)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Nepodařilo se načíst data')
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
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link to="/" className="text-vilekula-600 hover:text-vilekula-800">
          ← Zpět na přehled
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{trida?.nazev}</h1>
        <p className="mt-1 text-gray-600">
          {trida?.rocnik}. ročník • {trida?.skolni_rok} • {pololeti}. pololetí
        </p>
      </div>

      {/* Seznam žáků */}
      {zaci.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">V této třídě zatím nejsou žádní žáci.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Žák
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav hodnocení
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zaci.map((zak) => {
                const progress = zak.celkem_vystupu > 0 
                  ? Math.round((zak.vyplneno_hodnoceni / zak.celkem_vystupu) * 100)
                  : 0
                const isComplete = progress === 100

                return (
                  <tr key={zak.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {zak.prijmeni} {zak.jmeno}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isComplete ? 'bg-green-500' : 'bg-vilekula-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${
                          isComplete ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {zak.vyplneno_hodnoceni}/{zak.celkem_vystupu}
                        </span>
                        {isComplete && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/zak/${zak.id}/hodnoceni`}
                        className="inline-flex items-center px-3 py-1.5 border border-vilekula-600 text-vilekula-600 rounded-lg hover:bg-vilekula-50 transition text-sm font-medium"
                      >
                        {isComplete ? 'Upravit' : 'Hodnotit'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
