import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminTridy() {
  const [tridy, setTridy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Modal states
  const [showTridaModal, setShowTridaModal] = useState(false)
  const [showZakModal, setShowZakModal] = useState(false)
  const [editingTrida, setEditingTrida] = useState(null)
  const [selectedTrida, setSelectedTrida] = useState(null)
  const [zaci, setZaci] = useState([])
  
  // Form states
  const [tridaForm, setTridaForm] = useState({ nazev: '', rocnik: 1, skolni_rok: '' })
  const [zakForm, setZakForm] = useState({ jmeno: '', prijmeni: '' })

  // Aktuální školní rok
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const defaultSkolniRok = currentMonth >= 9 
    ? `${currentYear}/${currentYear + 1 - 2000}` 
    : `${currentYear - 1}/${currentYear - 2000}`

  useEffect(() => {
    loadTridy()
  }, [])

  const loadTridy = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('trida')
        .select('*')
        .order('aktivni', { ascending: false })
        .order('skolni_rok', { ascending: false })
        .order('rocnik')
        .order('nazev')

      if (error) throw error
      setTridy(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se načíst třídy')
    } finally {
      setLoading(false)
    }
  }

  const loadZaci = async (tridaId) => {
    try {
      const { data, error } = await supabase
        .from('zak')
        .select('*')
        .eq('trida_id', tridaId)
        .order('prijmeni')
        .order('jmeno')

      if (error) throw error
      setZaci(data)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleCreateTrida = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('trida')
        .insert({
          nazev: tridaForm.nazev,
          rocnik: parseInt(tridaForm.rocnik),
          skolni_rok: tridaForm.skolni_rok || defaultSkolniRok,
        })

      if (error) throw error

      setShowTridaModal(false)
      setTridaForm({ nazev: '', rocnik: 1, skolni_rok: '' })
      setSuccessMessage('Třída vytvořena')
      setTimeout(() => setSuccessMessage(''), 3000)
      loadTridy()
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se vytvořit třídu')
    }
  }

  const handleCreateZak = async (e) => {
    e.preventDefault()
    if (!selectedTrida) return

    try {
      const { error } = await supabase
        .from('zak')
        .insert({
          jmeno: zakForm.jmeno,
          prijmeni: zakForm.prijmeni,
          trida_id: selectedTrida.id,
        })

      if (error) throw error

      setZakForm({ jmeno: '', prijmeni: '' })
      setSuccessMessage('Žák přidán')
      setTimeout(() => setSuccessMessage(''), 3000)
      loadZaci(selectedTrida.id)
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se přidat žáka')
    }
  }

  const handleDeleteZak = async (zakId) => {
    if (!confirm('Opravdu chcete smazat tohoto žáka? Všechna jeho hodnocení budou ztracena.')) return

    try {
      const { error } = await supabase
        .from('zak')
        .delete()
        .eq('id', zakId)

      if (error) throw error

      setSuccessMessage('Žák smazán')
      setTimeout(() => setSuccessMessage(''), 3000)
      loadZaci(selectedTrida.id)
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se smazat žáka')
    }
  }

  const handleToggleTridaActive = async (trida) => {
    try {
      const { error } = await supabase
        .from('trida')
        .update({ aktivni: !trida.aktivni })
        .eq('id', trida.id)

      if (error) throw error
      loadTridy()
    } catch (err) {
      console.error('Error:', err)
      setError('Nepodařilo se upravit třídu')
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Správa tříd a žáků</h1>
          <p className="mt-1 text-gray-600">
            Vytváření tříd a přidávání žáků
          </p>
        </div>
        <button
          onClick={() => {
            setTridaForm({ nazev: '', rocnik: 1, skolni_rok: defaultSkolniRok })
            setShowTridaModal(true)
          }}
          className="px-4 py-2 bg-vilekula-600 text-white rounded-lg hover:bg-vilekula-700 transition"
        >
          + Nová třída
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900">×</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Seznam tříd */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tridy.map((trida) => (
          <div 
            key={trida.id} 
            className={`bg-white rounded-lg shadow p-4 border ${
              trida.aktivni ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{trida.nazev}</h3>
                <p className="text-sm text-gray-500">
                  {trida.rocnik}. ročník • {trida.skolni_rok}
                </p>
              </div>
              <button
                onClick={() => handleToggleTridaActive(trida)}
                className={`text-xs px-2 py-1 rounded ${
                  trida.aktivni 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {trida.aktivni ? 'Aktivní' : 'Neaktivní'}
              </button>
            </div>
            
            <button
              onClick={() => {
                setSelectedTrida(trida)
                loadZaci(trida.id)
                setShowZakModal(true)
              }}
              className="mt-2 text-sm text-vilekula-600 hover:text-vilekula-800 font-medium"
            >
              Spravovat žáky →
            </button>
          </div>
        ))}
      </div>

      {/* Modal - Nová třída */}
      {showTridaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nová třída</h2>
            
            <form onSubmit={handleCreateTrida} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Název třídy
                </label>
                <input
                  type="text"
                  required
                  value={tridaForm.nazev}
                  onChange={(e) => setTridaForm({ ...tridaForm, nazev: e.target.value })}
                  placeholder="např. Lišky"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ročník
                </label>
                <select
                  value={tridaForm.rocnik}
                  onChange={(e) => setTridaForm({ ...tridaForm, rocnik: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(r => (
                    <option key={r} value={r}>{r}. ročník</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Školní rok
                </label>
                <input
                  type="text"
                  required
                  value={tridaForm.skolni_rok}
                  onChange={(e) => setTridaForm({ ...tridaForm, skolni_rok: e.target.value })}
                  placeholder="např. 2025/26"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTridaModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-vilekula-600 text-white rounded-lg hover:bg-vilekula-700 transition"
                >
                  Vytvořit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Správa žáků */}
      {showZakModal && selectedTrida && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Žáci ve třídě: {selectedTrida.nazev}
            </h2>

            {/* Formulář pro přidání žáka */}
            <form onSubmit={handleCreateZak} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={zakForm.jmeno}
                onChange={(e) => setZakForm({ ...zakForm, jmeno: e.target.value })}
                placeholder="Jméno"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none"
              />
              <input
                type="text"
                required
                value={zakForm.prijmeni}
                onChange={(e) => setZakForm({ ...zakForm, prijmeni: e.target.value })}
                placeholder="Příjmení"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-vilekula-600 text-white rounded-lg hover:bg-vilekula-700 transition"
              >
                Přidat
              </button>
            </form>

            {/* Seznam žáků */}
            <div className="space-y-2">
              {zaci.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Zatím žádní žáci</p>
              ) : (
                zaci.map((zak) => (
                  <div key={zak.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className={zak.aktivni ? 'text-gray-900' : 'text-gray-400'}>
                      {zak.prijmeni} {zak.jmeno}
                      {!zak.aktivni && <span className="text-xs ml-2">(neaktivní)</span>}
                    </span>
                    <button
                      onClick={() => handleDeleteZak(zak.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Smazat
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowZakModal(false)
                  setSelectedTrida(null)
                  setZaci([])
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
