import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from '../components/Calendar'
import { DayPanel } from '../components/DayPanel'
import { StatsCards } from '../components/StatsCards'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import { useProgressStats } from '../hooks/useProgressStats'
import { useOnboarding } from '../hooks/useOnboarding'
import { buildWorkoutsCsv, downloadCsv } from '../lib/csv'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const { exercises, loading: exercisesLoading } = useExercises()
  const { workouts, loading: workoutsLoading } = useWorkouts()
  const stats = useProgressStats(exercises)
  const { completed: onboardingCompleted, loading: onboardingLoading } = useOnboarding()
  const [selectedDate, setSelectedDate] = useState<string>(today())

  const loading = exercisesLoading || workoutsLoading

  function handleExport() {
    const csv = buildWorkoutsCsv(exercises, workouts)
    downloadCsv(`gym-tracker-export-${today()}.csv`, csv)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button type="button" className="btn-secondary" onClick={handleExport} disabled={exercises.length === 0}>
          Esporta CSV
        </button>
      </div>

      {!onboardingLoading && !onboardingCompleted && (
        <div className="card flex flex-wrap items-center justify-between gap-3 bg-brand-50 dark:bg-brand-950">
          <div>
            <p className="font-semibold">Completa il questionario iniziale</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Obiettivo, esperienza, salute e alimentazione: serve per costruirti un piano di allenamento e dieta su misura.
            </p>
          </div>
          <Link to="/onboarding" className="btn-primary">Compila ora</Link>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Caricamento dati...</p>
      ) : (
        <>
          <StatsCards stats={stats} />
          <Calendar workouts={workouts} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <DayPanel date={selectedDate} exercises={exercises} workouts={workouts} />
        </>
      )}
    </div>
  )
}
