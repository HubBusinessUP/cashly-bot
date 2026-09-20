export type Goal = 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance' | 'strength'

export interface AppUser {
  id: string
  email: string
  goal: Goal | null
  createdAt: number
}

/** A logged performance entry: what the user actually lifted. */
export interface ExerciseLog {
  id: string
  userId: string
  name: string
  libraryId: string | null
  reps: number
  sets: number
  weight: number
  date: string // yyyy-MM-dd
  createdAt: number
  updatedAt: number
}

/** A calendar/session entry referencing a logged exercise. */
export interface Workout {
  id: string
  userId: string
  exerciseId: string
  date: string // yyyy-MM-dd, denormalized from the linked exercise for calendar queries
  notes: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface ExerciseLibraryItem {
  id: string
  name: string
  category: string
  equipment: string
  videoUrl: string
  description: string
}

export interface ExerciseFormValues {
  name: string
  libraryId: string | null
  reps: number
  sets: number
  weight: number
  date: string
  notes: string
  completed: boolean
}
