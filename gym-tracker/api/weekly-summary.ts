import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import { adminDb } from './_lib/firebaseAdmin'

interface ExerciseDoc {
  name: string
  sets: number
  reps: number
  weight: number
  date: string
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_PORT === '465',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  })
}

function summarize(exercises: ExerciseDoc[]) {
  const sessions = exercises.length
  const totalReps = exercises.reduce((sum, e) => sum + e.reps, 0)
  const avgReps = sessions ? Math.round((totalReps / sessions) * 10) / 10 : 0
  const maxWeight = sessions ? Math.max(...exercises.map((e) => e.weight)) : 0
  const totalVolume = Math.round(exercises.reduce((sum, e) => sum + e.reps * e.sets * e.weight, 0))
  return { sessions, avgReps, maxWeight, totalVolume }
}

function renderEmail(email: string, stats: ReturnType<typeof summarize>) {
  const subject = 'Il tuo riepilogo settimanale — Gym Tracker'
  const text =
    stats.sessions === 0
      ? `Ciao,\n\nNessun allenamento registrato questa settimana. Torna in palestra e registra il prossimo allenamento su Gym Tracker!`
      : `Ciao,\n\nEcco il riepilogo degli ultimi 7 giorni:\n` +
        `- Sessioni registrate: ${stats.sessions}\n` +
        `- Ripetizioni medie: ${stats.avgReps}\n` +
        `- Peso massimo sollevato: ${stats.maxWeight} kg\n` +
        `- Volume totale: ${stats.totalVolume} kg\n\n` +
        `Continua così!`
  return { to: email, subject, text }
}

/**
 * GET /api/weekly-summary
 * Intended to be triggered by a Vercel Cron Job (see vercel.json).
 * Auth: Authorization: Bearer <CRON_SECRET> (Vercel injects this automatically
 * for Cron Jobs when the CRON_SECRET env var is set on the project).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const db = adminDb()
  const usersSnap = await db.collection('users').get()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  const transport = buildTransport()
  let sent = 0
  const errors: string[] = []

  for (const userDoc of usersSnap.docs) {
    const email = userDoc.data().email as string | undefined
    if (!email) continue

    const exercisesSnap = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('exercises')
      .where('date', '>=', sevenDaysAgo)
      .get()

    const exercises = exercisesSnap.docs.map((d) => d.data() as ExerciseDoc)
    const stats = summarize(exercises)
    const message = renderEmail(email, stats)

    try {
      await transport.sendMail({ from: process.env.EMAIL_FROM, ...message })
      sent += 1
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  res.status(200).json({ usersProcessed: usersSnap.size, emailsSent: sent, errors })
}
