export type Goal = 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance' | 'strength'

export interface AppUser {
  id: string
  email: string
  goal: Goal | null
  createdAt: number
}

export type Sex = 'male' | 'female' | 'other'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrainingLocation = 'full_gym' | 'basic_gym' | 'home' | 'both'
export type Budget = 'low' | 'medium' | 'high'
export type JobType = 'sedentary' | 'standing' | 'physical'

/**
 * Onboarding intake questionnaire: everything a coach needs to design a weekly
 * workout + nutrition plan. Filled once (editable later), stored on the user doc.
 */
export interface OnboardingData {
  completedAt: number
  // Dati generali
  age: number | null
  sex: Sex | null
  heightCm: number | null
  weightKg: number | null
  targetWeightKg: number | null
  // Obiettivo
  primaryGoal: Goal | null
  secondaryGoal: string
  targetDate: string
  pastFailureReason: string
  // Allenamento
  trainingMonths: number | null
  level: ExperienceLevel | null
  daysPerWeek: number | null
  sessionMinutes: number | null
  location: TrainingLocation | null
  equipment: string
  strongExercises: string
  avoidExercises: string
  // Salute
  injuries: string
  painMovements: string
  conditions: string
  medications: string
  lastCheckup: string
  // Misure corporee
  waistCm: number | null
  hipsCm: number | null
  chestCm: number | null
  armCm: number | null
  bodyFatPercent: number | null
  // Alimentazione
  mealsPerDay: number | null
  mealControl: string
  foodExclusions: string
  foodNonNegotiables: string
  alcohol: string
  supplements: string
  budget: Budget | null
  // Stile di vita
  jobType: JobType | null
  sleepHours: number | null
  sleepQuality: number | null // 1-10
  stressLevel: number | null // 1-10
  dailyActivity: string
  // Preferenze
  trainingStyle: string
  dislikedExercises: string
  soloOrGroup: string
}

/** A single body-progress check-in: weight/height at a point in time, optionally with a progress photo. */
export interface BodyMetric {
  id: string
  userId: string
  date: string // yyyy-MM-dd
  weightKg: number
  heightCm: number | null
  notes: string
  photoUrl: string | null
  photoPath: string | null // Storage path, needed to delete the file when the entry is deleted
  createdAt: number
  updatedAt: number
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
  imageUrl?: string
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
