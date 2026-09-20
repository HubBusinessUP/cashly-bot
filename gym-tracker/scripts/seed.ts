/**
 * Seeds Firestore with a demo user's workout history from sample-data/sample-workouts.json.
 * Requires Firebase Admin credentials in the environment (see .env.example) and an existing
 * Firebase Auth user whose uid is passed via --uid, since exercises/workouts live under
 * users/{uid}/... Usage: npm run seed -- --uid=<firebase-auth-uid>
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { adminDb } from '../api/_lib/firebaseAdmin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SampleExercise {
  name: string
  libraryId: string | null
  sets: number
  reps: number
  weight: number
  date: string
  notes: string
  completed: boolean
}

async function main() {
  const uidArg = process.argv.find((a) => a.startsWith('--uid='))
  const uid = uidArg?.split('=')[1]
  if (!uid) {
    console.error('Usage: npm run seed -- --uid=<firebase-auth-uid>')
    process.exit(1)
  }

  const samplePath = path.join(__dirname, '..', 'sample-data', 'sample-workouts.json')
  const sample = JSON.parse(readFileSync(samplePath, 'utf-8')) as {
    user: { email: string; goal: string }
    exercises: SampleExercise[]
  }

  const db = adminDb()
  const userRef = db.collection('users').doc(uid)
  await userRef.set({ email: sample.user.email, goal: sample.user.goal, createdAt: new Date() }, { merge: true })

  const batch = db.batch()
  for (const ex of sample.exercises) {
    const exerciseRef = userRef.collection('exercises').doc()
    const workoutRef = userRef.collection('workouts').doc()
    const now = new Date()
    batch.set(exerciseRef, {
      name: ex.name,
      libraryId: ex.libraryId,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      date: ex.date,
      createdAt: now,
      updatedAt: now,
    })
    batch.set(workoutRef, {
      exerciseId: exerciseRef.id,
      date: ex.date,
      notes: ex.notes,
      completed: ex.completed,
      createdAt: now,
      updatedAt: now,
    })
  }
  await batch.commit()
  console.log(`Seeded ${sample.exercises.length} exercises for user ${uid}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
