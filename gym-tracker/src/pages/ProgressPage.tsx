import { useMemo, useState } from 'react'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import type { BodyMetric } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

export function ProgressPage() {
  const { metrics, loading, addMetric, deleteMetric } = useBodyMetrics()
  const [date, setDate] = useState(today())
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sorted = useMemo(() => [...metrics].sort((a, b) => a.date.localeCompare(b.date)), [metrics])
  const latest = metrics[0] ?? null
  const first = sorted[0] ?? null
  const weightChange = latest && first && latest.id !== first.id ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : null

  function handlePhotoChange(file: File | null) {
    setPhotoFile(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const weight = Number(weightKg)
    if (!Number.isFinite(weight) || weight <= 0) {
      setError('Inserisci un peso valido.')
      return
    }
    if (heightCm && (!Number.isFinite(Number(heightCm)) || Number(heightCm) <= 0)) {
      setError('Altezza non valida.')
      return
    }
    setSubmitting(true)
    try {
      await addMetric({
        date,
        weightKg: weight,
        heightCm: heightCm ? Number(heightCm) : null,
        notes,
        photoFile,
      })
      setWeightKg('')
      setNotes('')
      handlePhotoChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(metric: BodyMetric) {
    if (!confirm('Eliminare questo check-in (e la foto associata)?')) return
    await deleteMetric(metric)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progressi fisici</h1>

      {latest && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Peso attuale</p>
            <p className="mt-1 text-2xl font-bold text-brand-600">{latest.weightKg} kg</p>
          </div>
          {latest.heightCm && (
            <div className="card">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Altezza</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">{latest.heightCm} cm</p>
            </div>
          )}
          {weightChange !== null && (
            <div className="card">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Variazione dal primo check-in
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {weightChange > 0 ? '+' : ''}
                {weightChange} kg
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Nuovo check-in</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="pm-date">Data</label>
              <input id="pm-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pm-weight">Peso (kg)</label>
              <input id="pm-weight" type="number" step="0.1" className="input" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pm-height">Altezza (cm)</label>
              <input id="pm-height" type="number" step="0.5" className="input" placeholder="opzionale" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pm-notes">Note</label>
            <textarea id="pm-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Come ti senti, misure, sensazioni..." />
          </div>

          <div>
            <label className="label" htmlFor="pm-photo">Foto fisico (opzionale)</label>
            <input
              id="pm-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            {photoPreview && (
              <img src={photoPreview} alt="Anteprima foto" className="mt-2 max-h-64 rounded-lg border border-slate-200 object-contain dark:border-slate-800" />
            )}
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG o WebP, max 8MB. Visibile solo a te.</p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Salvataggio...' : 'Salva check-in'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Storico</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Caricamento...</p>
        ) : metrics.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nessun check-in registrato. Aggiungi peso, altezza e (facoltativo) una foto per iniziare a tracciare i progressi.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {metrics.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 flex-none rounded-lg bg-slate-100 dark:bg-slate-800" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {m.date} · {m.weightKg} kg{m.heightCm ? ` · ${m.heightCm} cm` : ''}
                  </p>
                  {m.notes && <p className="text-xs text-slate-500 dark:text-slate-400">{m.notes}</p>}
                </div>
                <button type="button" className="btn-danger" onClick={() => handleDelete(m)}>
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
