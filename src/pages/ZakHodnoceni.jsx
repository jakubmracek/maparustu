import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const OBLASTI = {
  'matematika': 'Matematika',
  'jazyk': 'Jazyk a komunikace',
  'umeni': 'Umění',
  'pohyb': 'Pohyb',
  'orientace_ve_svete': 'Orientace ve světě'
}

const STUPNE = [
  { value: null, label: '— Nevyplněno —', color: 'gray' },
  { value: 's_jistotou', label: 'Zvládá s jistotou', color: 'green' },
  { value: 'castecne', label: 'Zvládá částečně', color: 'yellow' },
  { value: 's_dopomoci', label: 'Zvládá s dopomocí', color: 'orange' },
  { value: 'nezacali', label: 'Zatím jsme nezačali', color: 'gray' },
  { value: 'nezvlada', label: 'Nezvládá', color: 'red' },
]

export default function ZakHodnoceni() {
  const { zakId } = useParams()
  const { ucitel } = useAuth()
  const [zak, setZak] = useState(null)
  const [trida, setTrida] = useState(null)
  const [vystupy, setVystupy] = useState([])
  const [hodnoceni, setHodnoceni] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeOblast, setActiveOblast] = useState('matematika')

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
  }, [zakId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Načti žáka a třídu
      const { data: zakData, error: zakError } = await supabase
        .from('zak')
        .select('*, trida:trida(*)')
        .eq('id', zakId)
        .single()

      if (zakError) throw zakError
      setZak(zakData)
      setTrida(zakData.trida)

      // Načti výstupy pro daný ročník
      const { data: vystupyData, error: vystupyError } = await supabase
        .from('vystup')
        .select('*')
        .eq('rocnik', zakData.trida.rocnik)
        .eq('aktivni', true)
        .order('oblast')
        .order('poradi')

      if (vystupyError) throw vystupyError
      setVystupy(vystupyData)

      // Načti existující hodnocení
      const { data: hodnoceniData, error: hodnoceniError } = await supabase
        .from('hodnoceni')
        .select('*')
        .eq('zak_id', zakId)
        .eq('skolni_rok', skolniRok)
        .eq('pololeti', pololeti)

      if (hodnoceniError) throw hodnoceniError

      // Převeď na objekt indexed by vystup_id
      const hodnoceniMap = {}
      hodnoceniData.forEach(h => {
        hodnoceniMap[h.vystup_id] = {
          id: h.id,
          stupen: h.stupen,
          poznamky: h.poznamky || [],
        }
      })
      setHodnoceni(hodnoceniMap)

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Nepodařilo se načíst data')
    } finally {
      setLoading(false)
    }
  }

  const handleStupenChange = async (vystupId, newStupen) => {
    const existing = hodnoceni[vystupId]
    
    setHodnoceni(prev => ({
      ...prev,
      [vystupId]: {
        ...prev[vystupId],
        stupen: newStupen,
      }
    }))

    try {
      if (existing?.id) {
        // Update
        await supabase
          .from('hodnoceni')
          .update({ 
            stupen: newStupen,
            autor_id: ucitel.id,
          })
          .eq('id', existing.id)
      } else {
        // Insert
        const { data } = await supabase
          .from('hodnoceni')
          .insert({
            zak_id: zakId,
            vystup_id: vystupId,
            skolni_rok: skolniRok,
            pololeti: pololeti,
            stupen: newStupen,
            poznamky: [],
            autor_id: ucitel.id,
          })
          .select()
          .single()

        setHodnoceni(prev => ({
          ...prev,
          [vystupId]: {
            ...prev[vystupId],
            id: data.id,
          }
        }))
      }
    } catch (err) {
      console.error('Error saving:', err)
      setError('Nepodařilo se uložit hodnocení')
    }
  }

  const handlePoznamkyChange = (vystupId, poznamkyText) => {
    const poznamkyArray = poznamkyText.split('\n').filter(p => p.trim())
    
    setHodnoceni(prev => ({
      ...prev,
      [vystupId]: {
        ...prev[vystupId],
        poznamky: poznamkyArray,
      }
    }))
  }

  const handlePoznamkyBlur = async (vystupId) => {
    const existing = hodnoceni[vystupId]
    if (!existing?.id) return

    try {
      await supabase
        .from('hodnoceni')
        .update({ 
          poznamky: existing.poznamky || [],
          autor_id: ucitel.id,
        })
        .eq('id', existing.id)
    } catch (err) {
      console.error('Error saving poznamky:', err)
    }
  }

  const exportMarkdown = async () => {
    try {
      const { data, error } = await supabase
        .rpc('export_hodnoceni_markdown', {
          p_zak_id: zakId,
          p_skolni_rok: skolniRok,
          p_pololeti: pololeti
        })

      if (error) throw error

      // Stáhni jako soubor
      const blob = new Blob([data], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hodnoceni_${zak.prijmeni}_${zak.jmeno}_${skolniRok.replace('/', '-')}_${pololeti}.md`
      a.click()
      URL.revokeObjectURL(url)

      setSuccessMessage('Export úspěšně stažen')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Export error:', err)
      setError('Nepodařilo se exportovat hodnocení')
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

  const vystupyByOblast = vystupy.reduce((acc, v) => {
    if (!acc[v.oblast]) acc[v.oblast] = []
    acc[v.oblast].push(v)
    return acc
  }, {})

  const getProgressForOblast = (oblast) => {
    const oblastVystupy = vystupyByOblast[oblast] || []
    const vyplneno = oblastVystupy.filter(v => hodnoceni[v.id]?.stupen).length
    return { vyplneno, celkem: oblastVystupy.length }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link to={`/trida/${trida?.id}`} className="text-vilekula-600 hover:text-vilekula-800">
          ← Zpět na třídu {trida?.nazev}
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {zak?.jmeno} {zak?.prijmeni}
          </h1>
          <p className="mt-1 text-gray-600">
            {trida?.nazev} • {trida?.rocnik}. ročník • {skolniRok} • {pololeti}. pololetí
          </p>
        </div>
        <button
          onClick={exportMarkdown}
          className="inline-flex items-center px-4 py-2 bg-vilekula-600 text-white rounded-lg hover:bg-vilekula-700 transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export do Markdown
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Oblast tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {Object.entries(OBLASTI).map(([key, label]) => {
            const progress = getProgressForOblast(key)
            const isActive = activeOblast === key
            const isComplete = progress.vyplneno === progress.celkem && progress.celkem > 0

            return (
              <button
                key={key}
                onClick={() => setActiveOblast(key)}
                className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                  isActive
                    ? 'border-vilekula-600 text-vilekula-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isComplete 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {progress.vyplneno}/{progress.celkem}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Výstupy pro aktivní oblast */}
      <div className="space-y-4">
        {(vystupyByOblast[activeOblast] || []).map((vystup) => {
          const h = hodnoceni[vystup.id] || {}
          const currentStupen = STUPNE.find(s => s.value === h.stupen)

          return (
            <div key={vystup.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Výstup text */}
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 font-mono text-sm">{vystup.poradi}.</span>
                    <p className="text-gray-800">{vystup.text}</p>
                  </div>
                </div>

                {/* Hodnocení controls */}
                <div className="lg:w-64 flex-shrink-0">
                  <select
                    value={h.stupen || ''}
                    onChange={(e) => handleStupenChange(vystup.id, e.target.value || null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none ${
                      h.stupen === 's_jistotou' ? 'border-green-300 bg-green-50' :
                      h.stupen === 'castecne' ? 'border-yellow-300 bg-yellow-50' :
                      h.stupen === 's_dopomoci' ? 'border-orange-300 bg-orange-50' :
                      h.stupen === 'nezvlada' ? 'border-red-300 bg-red-50' :
                      'border-gray-300'
                    }`}
                  >
                    {STUPNE.map((s) => (
                      <option key={s.value || 'null'} value={s.value || ''}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Poznámky */}
              {h.stupen && (
                <div className="mt-3 pl-6">
                  <textarea
                    placeholder="Poznámky (každý řádek = jedna poznámka)"
                    value={(h.poznamky || []).join('\n')}
                    onChange={(e) => handlePoznamkyChange(vystup.id, e.target.value)}
                    onBlur={() => handlePoznamkyBlur(vystup.id)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-vilekula-500 focus:border-vilekula-500 outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
