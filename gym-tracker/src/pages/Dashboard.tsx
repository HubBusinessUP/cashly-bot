import { useState } from 'react'
import { Calendar } from '../components/Calendar'
import { DayPanel } from '../components/DayPanel'
import { StatsCards } from '../components/StatsCards'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import { useProgressStats } from '../hooks/useProgressStats'
import { buildWorkoutsCsv, downloadCsv } from '../lib/csv'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const { exercises, loading: exercisesLoading } = useExercises()
  const { workouts, loading: workoutsLoading } = useWorkouts()
  const stats = useProgressStats(exercises)
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
