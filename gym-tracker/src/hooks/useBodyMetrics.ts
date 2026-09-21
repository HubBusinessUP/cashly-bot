import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { AuthRequiredError } from '../lib/errors'
import { sanitizeDate, sanitizeNumber, sanitizeText } from '../lib/sanitize'
import type { BodyMetric } from '../types'

export interface BodyMetricInput {
  date: string
  weightKg: number
  heightCm: number | null
  notes: string
  photoFile: File | null
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function toBodyMetric(id: string, userId: string, data: Record<string, unknown>): BodyMetric {
  return {
    id,
    userId,
    date: String(data.date ?? ''),
    weightKg: Number(data.weightKg ?? 0),
    heightCm: data.heightCm != null ? Number(data.heightCm) : null,
    notes: String(data.notes ?? ''),
    photoUrl: (data.photoUrl as string | null) ?? null,
    photoPath: (data.photoPath as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis?.() ?? Date.now(),
  }
}

export function useBodyMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setMetrics([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, 'users', user.uid, 'bodyMetrics'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMetrics(snap.docs.map((d) => toBodyMetric(d.id, user.uid, d.data())))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  async function addMetric(input: BodyMetricInput): Promise<void> {
    if (!user) throw new AuthRequiredError()
    if (input.photoFile) {
      if (input.photoFile.size > MAX_PHOTO_BYTES) {
        throw new Error('La foto supera 8MB.')
      }
      if (!ALLOWED_PHOTO_TYPES.includes(input.photoFile.type)) {
        throw new Error('Formato foto non supportato (usa JPEG, PNG o WebP).')
      }
    }

    const ref_ = doc(collection(db, 'users', user.uid, 'bodyMetrics'))
    let photoUrl: string | null = null
    let photoPath: string | null = null

    if (input.photoFile) {
      const ext = input.photoFile.type === 'image/png' ? 'png' : input.photoFile.type === 'image/webp' ? 'webp' : 'jpg'
      photoPath = `users/${user.uid}/progress-photos/${ref_.id}.${ext}`
      const storageRef = ref(storage, photoPath)
      await uploadBytes(storageRef, input.photoFile, { contentType: input.photoFile.type })
      photoUrl = await getDownloadURL(storageRef)
    }

    await setDoc(ref_, {
      date: sanitizeDate(input.date),
      weightKg: sanitizeNumber(input.weightKg, { min: 0, max: 400 }),
      heightCm: input.heightCm != null ? sanitizeNumber(input.heightCm, { min: 0, max: 300 }) : null,
      notes: sanitizeText(input.notes, 500),
      photoUrl,
      photoPath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteMetric(metric: BodyMetric): Promise<void> {
    if (!user) throw new AuthRequiredError()
    if (metric.photoPath) {
      try {
        await deleteObject(ref(storage, metric.photoPath))
      } catch {
        // photo may already be gone — proceed with deleting the record regardless
      }
    }
    await deleteDoc(doc(db, 'users', user.uid, 'bodyMetrics', metric.id))
  }

  return { metrics, loading, addMetric, deleteMetric }
}
