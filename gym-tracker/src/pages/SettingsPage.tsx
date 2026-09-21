import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useUserProfile } from '../hooks/useUserProfile'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import { buildWorkoutsCsv, downloadCsv } from '../lib/csv'
import type { Goal } from '../types'

const GOALS: { value: Goal; label: string }[] = [
  { value: 'lose_weight', label: 'Perdere peso' },
  { value: 'build_muscle', label: 'Aumentare massa muscolare' },
  { value: 'strength', label: 'Aumentare la forza' },
  { value: 'endurance', label: 'Migliorare la resistenza' },
  { value: 'maintain', label: 'Mantenimento' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { goal, updateGoal } = useUserProfile()
  const { exercises } = useExercises()
  const { workouts } = useWorkouts()
  const [saved, setSaved] = useState(false)

  async function handleGoalChange(newGoal: Goal) {
    await updateGoal(newGoal)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleExport() {
    const csv = buildWorkoutsCsv(exercises, workouts)
    downloadCsv(`gym-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      <div className="card space-y-2">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Obiettivo</h2>
        <select
          className="input"
          value={goal ?? ''}
          onChange={(e) => handleGoalChange(e.target.value as Goal)}
        >
          {GOALS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        {saved && <p className="text-xs text-emerald-600">Salvato.</p>}
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Aspetto</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Tema attuale: {theme === 'dark' ? 'Scuro' : 'Chiaro'}
          </span>
          <button type="button" className="btn-secondary" onClick={toggleTheme}>
            Cambia tema
          </button>
        </div>
        <p className="text-xs text-slate-500">La preferenza viene salvata su questo dispositivo.</p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Esporta dati</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Scarica tutti i tuoi allenamenti in formato CSV.
        </p>
        <button type="button" className="btn-primary" onClick={handleExport} disabled={exercises.length === 0}>
          Esporta CSV
        </button>
      </div>
    </div>
  )
}
