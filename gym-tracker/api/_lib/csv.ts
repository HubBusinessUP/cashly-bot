function csvEscape(value: string | number | boolean): string {
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

interface ExerciseRow {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  date: string
}

interface WorkoutRow {
  exerciseId: string
  notes: string
  completed: boolean
}

export function buildCsv(exercises: ExerciseRow[], workouts: WorkoutRow[]): string {
  const workoutsByExercise = new Map<string, WorkoutRow[]>()
  for (const w of workouts) {
    const list = workoutsByExercise.get(w.exerciseId) ?? []
    list.push(w)
    workoutsByExercise.set(w.exerciseId, list)
  }

  const rows = ['date,exercise_name,sets,reps,weight_kg,notes,completed']
  for (const ex of [...exercises].sort((a, b) => a.date.localeCompare(b.date))) {
    const linked = workoutsByExercise.get(ex.id) ?? [null]
    for (const w of linked) {
      rows.push(
        [ex.date, ex.name, ex.sets, ex.reps, ex.weight, w?.notes ?? '', w ? (w.completed ? 'yes' : 'no') : '']
          .map(csvEscape)
          .join(','),
      )
    }
  }
  return rows.join('\n')
}
