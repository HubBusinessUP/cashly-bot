import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, EXERCISE_LIBRARY } from '../data/exerciseLibrary'
import { YouTubeEmbed } from '../components/YouTubeEmbed'

const PAGE_SIZE = 30

export function LibraryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesTerm = !term || ex.name.toLowerCase().includes(term) || ex.equipment.toLowerCase().includes(term)
      const matchesCategory = category === 'all' || ex.category === category
      return matchesTerm && matchesCategory
    })
  }, [search, category])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, category])

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Libreria esercizi</h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">{EXERCISE_LIBRARY.length} esercizi</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Cerca esercizio o attrezzo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[200px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Tutte le categorie</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">Nessun esercizio trovato.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((ex) => (
              <div key={ex.id} className="card">
                <p className="font-semibold">{ex.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ex.category} · {ex.equipment}</p>
                {ex.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ex.description}</p>}
                {ex.imageUrl && (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    loading="lazy"
                    className="mt-2 aspect-video w-full rounded-lg border border-slate-200 object-cover dark:border-slate-800"
                  />
                )}
                <YouTubeEmbed videoUrl={ex.videoUrl} title={ex.name} />
              </div>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="flex justify-center pt-2">
              <button type="button" className="btn-secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Mostra altri ({filtered.length - visibleCount} rimanenti)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
