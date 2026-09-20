import type { ExerciseLibraryItem } from '../types'

// Static reference library. Each exercise links to a YouTube tutorial.
export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { id: 'squat', name: 'Barbell Back Squat', category: 'Legs', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Compound lower-body lift targeting quads, glutes and hamstrings.' },
  { id: 'deadlift', name: 'Conventional Deadlift', category: 'Back', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', description: 'Full posterior chain lift: hamstrings, glutes, spinal erectors.' },
  { id: 'bench-press', name: 'Barbell Bench Press', category: 'Chest', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Horizontal push for chest, shoulders and triceps.' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'Shoulders', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', description: 'Vertical push building shoulder and triceps strength.' },
  { id: 'pull-up', name: 'Pull-Up', category: 'Back', equipment: 'Bodyweight', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', description: 'Vertical pull for lats and biceps.' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'Back', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=9efgcAjQe7E', description: 'Horizontal pull building back thickness.' },
  { id: 'dumbbell-curl', name: 'Dumbbell Bicep Curl', category: 'Arms', equipment: 'Dumbbell', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Isolation movement for the biceps.' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Arms', equipment: 'Cable', videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Isolation movement for the triceps.' },
  { id: 'lunges', name: 'Walking Lunges', category: 'Legs', equipment: 'Dumbbell', videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', description: 'Unilateral leg exercise for quads and glutes.' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', equipment: 'Machine', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Machine-based quad-dominant push.' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', equipment: 'Cable', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Machine alternative to pull-ups.' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', equipment: 'Dumbbell', videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog', description: 'Vertical push for shoulders with dumbbells.' },
  { id: 'plank', name: 'Plank', category: 'Core', equipment: 'Bodyweight', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw', description: 'Isometric core stability exercise.' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', category: 'Legs', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=xDmFkJWFX7Q', description: 'Glute-focused hip extension movement.' },
  { id: 'dips', name: 'Triceps Dips', category: 'Arms', equipment: 'Bodyweight', videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As', description: 'Compound push for chest and triceps.' },
  { id: 'incline-bench', name: 'Incline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell', videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Upper-chest focused pressing movement.' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Legs', equipment: 'Barbell', videoUrl: 'https://www.youtube.com/watch?v=jEy_czb3RKA', description: 'Hip-hinge movement targeting hamstrings and glutes.' },
  { id: 'face-pull', name: 'Cable Face Pull', category: 'Shoulders', equipment: 'Cable', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk', description: 'Rear delt and upper back health exercise.' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Legs', equipment: 'Dumbbell', videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4', description: 'Beginner-friendly squat variation.' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core', equipment: 'Bodyweight', videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI', description: 'Rotational core exercise.' },
]

export function findLibraryItem(id: string | null): ExerciseLibraryItem | undefined {
  if (!id) return undefined
  return EXERCISE_LIBRARY.find((e) => e.id === id)
}

export const CATEGORIES = Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.category))).sort()
