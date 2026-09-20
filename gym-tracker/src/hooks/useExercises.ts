import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { AuthRequiredError, ConflictError } from '../lib/errors'
import { sanitizeDate, sanitizeNumber, sanitizeText } from '../lib/sanitize'
import type { ExerciseLog } from '../types'

export interface ExerciseInput {
  name: string
  libraryId: string | null
  reps: number
  sets: number
  weight: number
  date: string
}

function toExerciseLog(id: string, userId: string, data: Record<string, unknown>): ExerciseLog {
  return {
    id,
    userId,
    name: String(data.name ?? ''),
    libraryId: (data.libraryId as string | null) ?? null,
    reps: Number(data.reps ?? 0),
    sets: Number(data.sets ?? 0),
    weight: Number(data.weight ?? 0),
    date: String(data.date ?? ''),
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
  }
}

export function useExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setExercises([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, 'users', user.uid, 'exercises'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setExercises(snap.docs.map((d) => toExerciseLog(d.id, user.uid, d.data())))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  async function addExercise(input: ExerciseInput): Promise<string> {
    if (!user) throw new AuthRequiredError()
    const clean = sanitizeExerciseInput(input)
    const ref = doc(collection(db, 'users', user.uid, 'exercises'))
    await runTransaction(db, async (tx) => {
      tx.set(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
    return ref.id
  }

  /** Updates an exercise, rejecting with ConflictError if it changed since `expectedUpdatedAt`. */
  async function updateExercise(
    id: string,
    input: ExerciseInput,
    expectedUpdatedAt: number,
  ): Promise<void> {
    if (!user) throw new AuthRequiredError()
    const clean = sanitizeExerciseInput(input)
    const ref = doc(db, 'users', user.uid, 'exercises', id)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new ConflictError('This entry no longer exists.')
      const currentUpdatedAt = (snap.data().updatedAt as Timestamp | undefined)?.toMillis?.() ?? 0
      if (currentUpdatedAt > expectedUpdatedAt) {
        throw new ConflictError()
      }
      tx.update(ref, { ...clean, updatedAt: serverTimestamp() })
    })
  }

  async function deleteExercise(id: string): Promise<void> {
    if (!user) throw new AuthRequiredError()
    await deleteDoc(doc(db, 'users', user.uid, 'exercises', id))
  }

  return { exercises, loading, addExercise, updateExercise, deleteExercise }
}

function sanitizeExerciseInput(input: ExerciseInput) {
  return {
    name: sanitizeText(input.name, 100),
    libraryId: input.libraryId,
    reps: sanitizeNumber(input.reps, { min: 0, max: 1000 }),
    sets: sanitizeNumber(input.sets, { min: 0, max: 100 }),
    weight: sanitizeNumber(input.weight, { min: 0, max: 2000 }),
    date: sanitizeDate(input.date),
  }
}

/** Unused directly but kept for symmetry / future filtered queries by date range. */
export function exercisesInRangeQuery(userId: string, from: string, to: string) {
  return query(
    collection(db, 'users', userId, 'exercises'),
    where('date', '>=', from),
    where('date', '<=', to),
  )
}
