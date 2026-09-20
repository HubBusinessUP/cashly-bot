import type { ExerciseLog, Workout } from '../types'

function csvEscape(value: string | number | boolean): string {
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildWorkoutsCsv(exercises: ExerciseLog[], workouts: Workout[]): string {
  const workoutsByExercise = new Map<string, Workout[]>()
  for (const w of workouts) {
    const list = workoutsByExercise.get(w.exerciseId) ?? []
    list.push(w)
    workoutsByExercise.set(w.exerciseId, list)
  }

  const header = [
    'date',
    'exercise_name',
    'sets',
    'reps',
    'weight_kg',
    'notes',
    'completed',
  ]
  const rows: string[] = [header.join(',')]

  for (const ex of [...exercises].sort((a, b) => a.date.localeCompare(b.date))) {
    const linkedWorkouts = workoutsByExercise.get(ex.id) ?? [null]
    for (const w of linkedWorkouts) {
      rows.push(
        [
          ex.date,
          ex.name,
          ex.sets,
          ex.reps,
          ex.weight,
          w?.notes ?? '',
          w ? (w.completed ? 'yes' : 'no') : '',
        ]
          .map(csvEscape)
          .join(','),
      )
    }
  }
  return rows.join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
