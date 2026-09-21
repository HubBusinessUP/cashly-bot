import type { ExerciseLibraryItem } from '../types'
import { GENERATED_EXERCISE_LIBRARY } from './exerciseLibrary.generated'

// Hand-picked exercises with a real curated YouTube tutorial (rendered as an inline embed).
const CURATED_EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { id: 'squat', name: 'Barbell Back Squat', category: 'Gambe', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Alzata composta per gambe: coinvolge quadricipiti, glutei e femorali.' },
  { id: 'deadlift', name: 'Conventional Deadlift', category: 'Schiena', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', description: 'Catena posteriore completa: femorali, glutei, erettori spinali.' },
  { id: 'bench-press', name: 'Barbell Bench Press', category: 'Petto', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Spinta orizzontale per petto, spalle e tricipiti.' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'Spalle', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', description: 'Spinta verticale per forza di spalle e tricipiti.' },
  { id: 'pull-up', name: 'Pull-Up', category: 'Schiena', equipment: 'Corpo libero', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', description: 'Trazione verticale per dorsali e bicipiti.' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Schiena', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=9efgcAjQe7E', description: 'Trazione orizzontale per lo spessore della schiena.' },
  { id: 'dumbbell-curl', name: 'Dumbbell Bicep Curl', category: 'Braccia', equipment: 'Manubri', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Isolamento per i bicipiti.' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Braccia', equipment: 'Cavo', videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Isolamento per i tricipiti.' },
  { id: 'lunges', name: 'Walking Lunges', category: 'Gambe', equipment: 'Manubri', videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', description: 'Esercizio unilaterale per quadricipiti e glutei.' },
  { id: 'leg-press', name: 'Leg Press', category: 'Gambe', equipment: 'Macchina', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Spinta su macchina, dominante di quadricipiti.' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Schiena', equipment: 'Cavo', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Alternativa su macchina alla trazione alla sbarra.' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Spalle', equipment: 'Manubri', videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog', description: 'Spinta verticale per le spalle con i manubri.' },
  { id: 'plank', name: 'Plank', category: 'Core', equipment: 'Corpo libero', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw', description: 'Esercizio isometrico di stabilità del core.' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', category: 'Gambe', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=xDmFkJWFX7Q', description: 'Estensione d’anca mirata ai glutei.' },
  { id: 'dips', name: 'Triceps Dips', category: 'Braccia', equipment: 'Corpo libero', videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As', description: 'Spinta composta per petto e tricipiti.' },
  { id: 'incline-bench', name: 'Incline Dumbbell Press', category: 'Petto', equipment: 'Manubri', videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Spinta focalizzata sulla parte alta del petto.' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Gambe', equipment: 'Bilanciere', videoUrl: 'https://www.youtube.com/watch?v=jEy_czb3RKA', description: 'Hip-hinge per femorali e glutei.' },
  { id: 'face-pull', name: 'Cable Face Pull', category: 'Spalle', equipment: 'Cavo', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk', description: 'Esercizio di salute per deltoidi posteriori e schiena alta.' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Gambe', equipment: 'Manubri', videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4', description: 'Variante di squat adatta ai principianti.' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core', equipment: 'Corpo libero', videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI', description: 'Esercizio rotazionale per il core.' },
]

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const curatedNames = new Set(CURATED_EXERCISE_LIBRARY.map((e) => normalizeName(e.name)))

// Full library: curated exercises (real embedded YouTube video) first, then the bulk
// imported database (free-exercise-db) for everything else, deduplicated by name.
export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  ...CURATED_EXERCISE_LIBRARY,
  ...GENERATED_EXERCISE_LIBRARY.filter((e) => !curatedNames.has(normalizeName(e.name))),
]

export function findLibraryItem(id: string | null): ExerciseLibraryItem | undefined {
  if (!id) return undefined
  return EXERCISE_LIBRARY.find((e) => e.id === id)
}

export const CATEGORIES = Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.category))).sort()
