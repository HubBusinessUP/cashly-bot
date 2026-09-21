import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { AuthRequiredError, ConflictError } from '../lib/errors'
import { sanitizeDate, sanitizeText } from '../lib/sanitize'
import type { ExerciseInput } from './useExercises'
import type { Workout } from '../types'

function toWorkout(id: string, userId: string, data: Record<string, unknown>): Workout {
  return {
    id,
    userId,
    exerciseId: String(data.exerciseId ?? ''),
    date: String(data.date ?? ''),
    notes: String(data.notes ?? ''),
    completed: Boolean(data.completed),
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
  }
}

export function useWorkouts() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setWorkouts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, 'users', user.uid, 'workouts'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setWorkouts(snap.docs.map((d) => toWorkout(d.id, user.uid, d.data())))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  /** Creates the exercise log and its linked calendar workout entry atomically. */
  async function logExercise(
    exerciseInput: ExerciseInput,
    notes: string,
    completed: boolean,
  ): Promise<void> {
    if (!user) throw new AuthRequiredError()
    const batch = writeBatch(db)
    const exerciseRef = doc(collection(db, 'users', user.uid, 'exercises'))
    const workoutRef = doc(collection(db, 'users', user.uid, 'workouts'))
    const date = sanitizeDate(exerciseInput.date)

    batch.set(exerciseRef, {
      name: sanitizeText(exerciseInput.name, 100),
      libraryId: exerciseInput.libraryId,
      reps: exerciseInput.reps,
      sets: exerciseInput.sets,
      weight: exerciseInput.weight,
      date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(workoutRef, {
      exerciseId: exerciseRef.id,
      date,
      notes: sanitizeText(notes, 500),
      completed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  async function updateWorkout(
    id: string,
    updates: { notes: string; completed: boolean },
    expectedUpdatedAt: number,
  ): Promise<void> {
    if (!user) throw new AuthRequiredError()
    const ref = doc(db, 'users', user.uid, 'workouts', id)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new ConflictError('This workout no longer exists.')
      const currentUpdatedAt = (snap.data().updatedAt as Timestamp | undefined)?.toMillis?.() ?? 0
      if (currentUpdatedAt > expectedUpdatedAt) {
        throw new ConflictError()
      }
      tx.update(ref, {
        notes: sanitizeText(updates.notes, 500),
        completed: updates.completed,
        updatedAt: serverTimestamp(),
      })
    })
  }

  async function deleteWorkout(id: string, exerciseId: string): Promise<void> {
    if (!user) throw new AuthRequiredError()
    const batch = writeBatch(db)
    batch.delete(doc(db, 'users', user.uid, 'workouts', id))
    batch.delete(doc(db, 'users', user.uid, 'exercises', exerciseId))
    await batch.commit()
  }

  return { workouts, loading, logExercise, updateWorkout, deleteWorkout }
}
