import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminDb } from './_lib/firebaseAdmin'
import { requireUid, UnauthorizedError } from './_lib/verifyAuth'
import { buildCsv } from './_lib/csv'

/**
 * GET /api/export-csv
 * Auth: Authorization: Bearer <Firebase ID token>
 * Streams the authenticated user's full workout history as CSV.
 * Server-side export exists alongside the client-side one so a user's
 * complete history can be pulled without downloading every doc to the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let uid: string
  try {
    uid = await requireUid(req)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message })
      return
    }
    throw err
  }

  const db = adminDb()
  const [exercisesSnap, workoutsSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('exercises').get(),
    db.collection('users').doc(uid).collection('workouts').get(),
  ])

  const exercises = exercisesSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: String(data.name ?? ''),
      sets: Number(data.sets ?? 0),
      reps: Number(data.reps ?? 0),
      weight: Number(data.weight ?? 0),
      date: String(data.date ?? ''),
    }
  })
  const workouts = workoutsSnap.docs.map((d) => {
    const data = d.data()
    return {
      exerciseId: String(data.exerciseId ?? ''),
      notes: String(data.notes ?? ''),
      completed: Boolean(data.completed),
    }
  })

  const csv = buildCsv(exercises, workouts)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="gym-tracker-export.csv"`)
  res.status(200).send(csv)
}
