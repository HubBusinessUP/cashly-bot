import { useMemo, useState } from 'react'
import { CATEGORIES, EXERCISE_LIBRARY } from '../data/exerciseLibrary'

export function LibraryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesTerm = !term || ex.name.toLowerCase().includes(term) || ex.equipment.toLowerCase().includes(term)
      const matchesCategory = category === 'all' || ex.category === category
      return matchesTerm && matchesCategory
    })
  }, [search, category])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Libreria esercizi</h1>

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <div key={ex.id} className="card">
              <p className="font-semibold">{ex.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ex.category} · {ex.equipment}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ex.description}</p>
              <a
                href={ex.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Guarda il video tutorial su YouTube
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
