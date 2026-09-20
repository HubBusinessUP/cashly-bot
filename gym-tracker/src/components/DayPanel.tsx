import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Modal } from './Modal'
import { ExerciseForm } from './ExerciseForm'
import { findLibraryItem } from '../data/exerciseLibrary'
import { useExercises } from '../hooks/useExercises'
import { useWorkouts } from '../hooks/useWorkouts'
import { ConflictError } from '../lib/errors'
import type { ExerciseFormSchema } from '../lib/schema'
import type { ExerciseLog, Workout } from '../types'

interface DayPanelProps {
  date: string
  exercises: ExerciseLog[]
  workouts: Workout[]
}

export function DayPanel({ date, exercises, workouts }: DayPanelProps) {
  const { updateExercise } = useExercises()
  const { logExercise, updateWorkout, deleteWorkout } = useWorkouts()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<{ exercise: ExerciseLog; workout: Workout } | null>(null)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  const dayWorkouts = workouts.filter((w) => w.date === date)
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))

  async function handleAdd(values: ExerciseFormSchema) {
    await logExercise(
      { name: values.name, libraryId: values.libraryId, reps: values.reps, sets: values.sets, weight: values.weight, date },
      values.notes ?? '',
      values.completed,
    )
    setAdding(false)
  }

  async function handleEditSubmit(values: ExerciseFormSchema) {
    if (!editing) return
    try {
      await updateExercise(
        editing.exercise.id,
        { name: values.name, libraryId: values.libraryId, reps: values.reps, sets: values.sets, weight: values.weight, date: values.date },
        editing.exercise.updatedAt,
      )
      await updateWorkout(
        editing.workout.id,
        { notes: values.notes ?? '', completed: values.completed },
        editing.workout.updatedAt,
      )
      setEditing(null)
    } catch (err) {
      if (err instanceof ConflictError) {
        setConflictMessage(err.message)
      } else {
        throw err
      }
    }
  }

  async function handleDelete(workout: Workout) {
    if (!confirm('Eliminare questo allenamento?')) return
    await deleteWorkout(workout.id, workout.exerciseId)
  }

  return (
    <div className="card mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{format(parseISO(date), 'EEEE d MMMM yyyy', { locale: it })}</h3>
        <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
          Aggiungi esercizio
        </button>
      </div>

      {dayWorkouts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nessun esercizio registrato per questo giorno.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {dayWorkouts.map((w) => {
            const ex = exerciseById.get(w.exerciseId)
            if (!ex) return null
            const libItem = findLibraryItem(ex.libraryId)
            return (
              <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setEditing({ exercise: ex, workout: w })}
                >
                  <p className="font-medium">
                    {ex.name} {w.completed && <span className="text-xs text-emerald-600">(completato)</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {ex.sets}x{ex.reps} @ {ex.weight}kg
                    {libItem && (
                      <>
                        {' · '}
                        <a
                          href={libItem.videoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-brand-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          video tutorial
                        </a>
                      </>
                    )}
                  </p>
                </button>
                <button type="button" className="btn-danger" onClick={() => handleDelete(w)}>
                  Elimina
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <Modal title="Aggiungi esercizio" onClose={() => setAdding(false)}>
          <ExerciseForm defaultValues={{ date }} onSubmit={handleAdd} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Modifica esercizio" onClose={() => setEditing(null)}>
          <ExerciseForm
            defaultValues={{
              name: editing.exercise.name,
              libraryId: editing.exercise.libraryId,
              sets: editing.exercise.sets,
              reps: editing.exercise.reps,
              weight: editing.exercise.weight,
              date: editing.exercise.date,
              notes: editing.workout.notes,
              completed: editing.workout.completed,
            }}
            submitLabel="Aggiorna"
            onSubmit={handleEditSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {conflictMessage && (
        <Modal title="Conflitto di modifica" onClose={() => setConflictMessage(null)}>
          <p className="text-sm text-slate-700 dark:text-slate-300">{conflictMessage}</p>
          <div className="mt-4 flex justify-end">
            <button type="button" className="btn-primary" onClick={() => setConflictMessage(null)}>
              Ho capito
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
