import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminUzivatele() {
  const [ucitele, setUcitele] = useState([])
  const [tridy, setTridy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUcitel, setEditingUcitel] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Načti učitele s jejich třídami
      const { data: uciteleData, error: uciteleError } = await supabase
        .from('ucitel')
        .select(`
          *,
          ucitel_trida(
            trida:trida(id, nazev, rocnik, skolni_rok)
          )
        `)
        .order('prijmeni')

      if (uciteleError) throw uciteleError
      setUcitele(uciteleData)

      // Načti aktivní třídy
      const { data: tridyData, error: tridyError } = await supabase
        .from('trida')
        .select('*')
        .eq('aktivni', true)
        .order('rocnik')
        .order('nazev')

      if (tridyError) throw tridyError
      setTridy(tridyData)

    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se načíst data')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTrida = async (ucitelId, tridaId, assign) => {
    try {
      if (assign) {
        await supabase
          .from('ucitel_trida')
          .insert({ ucitel_id: ucitelId, trida_id: tridaId })
      } else {
        await supabase
          .from('ucitel_trida')
          .delete()
          .eq('ucitel_id', ucitelId)
          .eq('trida_id', tridaId)
      }
      loadData()
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se upravit přiřazení')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vilekula-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Správa uživatelů</h1>
        <p className="mt-1 text-gray-600">
          Přiřazení učitelů ke třídám
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Učitel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Přiřazené třídy
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ucitele.map((u) => {
              const prirazeneTridy = u.ucitel_trida?.map(ut => ut.trida) || []
              
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {u.jmeno} {u.prijmeni}
                    </div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Učitel'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {prirazeneTridy.length > 0 ? (
                        prirazeneTridy.map(t => (
                          <span key={t.id} className="px-2 py-1 bg-vilekula-100 text-vilekula-700 rounded text-xs">
                            {t.nazev}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Žádné</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditingUcitel(u)}
                      className="text-vilekula-600 hover:text-vilekula-800 text-sm font-medium"
                    >
                      Upravit třídy
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal pro úpravu tříd */}
      {editingUcitel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Třídy pro: {editingUcitel.jmeno} {editingUcitel.prijmeni}
            </h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tridy.map((trida) => {
                const isAssigned = editingUcitel.ucitel_trida?.some(
                  ut => ut.trida.id === trida.id
                )
                
                return (
                  <label key={trida.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={(e) => handleAssignTrida(editingUcitel.id, trida.id, e.target.checked)}
                      className="h-4 w-4 text-vilekula-600 rounded border-gray-300 focus:ring-vilekula-500"
                    />
                    <span className="text-gray-900">
                      {trida.nazev}
                      <span className="text-gray-500 text-sm ml-2">
                        ({trida.rocnik}. ročník, {trida.skolni_rok})
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setEditingUcitel(null)
                  loadData()
                }}
                className="px-4 py-2 bg-vilekula-600 text-white rounded-lg hover:bg-vilekula-700 transition"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poznámka o přidávání uživatelů */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">Přidání nového učitele</h3>
        <p className="text-sm text-blue-700 mt-1">
          Pro přidání nového učitele:
        </p>
        <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
          <li>Jdi do Supabase Dashboard → Authentication → Users</li>
          <li>Klikni "Add user" a vytvoř účet s emailem a heslem</li>
          <li>Zkopíruj User UID</li>
          <li>V SQL Editoru spusť INSERT do tabulky "ucitel"</li>
        </ol>
      </div>
    </div>
  )
}
