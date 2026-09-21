import type { OnboardingData } from '../types'

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Perdere peso',
  build_muscle: 'Aumentare massa muscolare',
  strength: 'Aumentare la forza',
  endurance: 'Migliorare la resistenza',
  maintain: 'Mantenimento',
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzato',
}
const LOCATION_LABELS: Record<string, string> = {
  full_gym: 'Palestra attrezzata',
  basic_gym: 'Palestra base',
  home: 'Casa',
  both: 'Entrambi',
}
const BUDGET_LABELS: Record<string, string> = { low: 'Basso', medium: 'Medio', high: 'Alto' }
const JOB_LABELS: Record<string, string> = { sedentary: 'Sedentario', standing: 'In piedi', physical: 'Fisico' }
const SEX_LABELS: Record<string, string> = { male: 'Uomo', female: 'Donna', other: 'Altro' }

function line(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  return `${label}: ${value}`
}

/** Formats the onboarding answers as plain text, ready to paste to a coach for a personalized plan. */
export function buildOnboardingSummary(data: OnboardingData): string {
  const sections: (string | null)[][] = [
    [
      '## Dati generali',
      line('Età', data.age),
      line('Sesso', data.sex ? SEX_LABELS[data.sex] : null),
      line('Altezza', data.heightCm ? `${data.heightCm} cm` : null),
      line('Peso attuale', data.weightKg ? `${data.weightKg} kg` : null),
      line('Peso obiettivo', data.targetWeightKg ? `${data.targetWeightKg} kg` : null),
    ],
    [
      '## Obiettivo',
      line('Obiettivo primario', data.primaryGoal ? GOAL_LABELS[data.primaryGoal] : null),
      line('Obiettivo secondario', data.secondaryGoal),
      line('Scadenza', data.targetDate),
      line('Motivo di fallimenti passati', data.pastFailureReason),
    ],
    [
      '## Allenamento',
      line('Mesi di esperienza', data.trainingMonths),
      line('Livello', data.level ? LEVEL_LABELS[data.level] : null),
      line('Giorni/settimana disponibili', data.daysPerWeek),
      line('Minuti per sessione', data.sessionMinutes),
      line('Dove si allena', data.location ? LOCATION_LABELS[data.location] : null),
      line('Attrezzatura disponibile', data.equipment),
      line('Esercizi che sa fare bene', data.strongExercises),
      line('Esercizi da evitare', data.avoidExercises),
    ],
    [
      '## Salute',
      line('Infortuni', data.injuries),
      line('Dolori a certi movimenti', data.painMovements),
      line('Patologie note', data.conditions),
      line('Farmaci', data.medications),
      line('Ultimo controllo medico', data.lastCheckup),
    ],
    [
      '## Misure corporee',
      line('Girovita', data.waistCm ? `${data.waistCm} cm` : null),
      line('Girofianchi', data.hipsCm ? `${data.hipsCm} cm` : null),
      line('Girotorace', data.chestCm ? `${data.chestCm} cm` : null),
      line('Girobraccio', data.armCm ? `${data.armCm} cm` : null),
      line('% grasso stimata', data.bodyFatPercent ? `${data.bodyFatPercent}%` : null),
    ],
    [
      '## Alimentazione',
      line('Pasti al giorno', data.mealsPerDay),
      line('Controllo sul cibo', data.mealControl),
      line('Alimenti esclusi', data.foodExclusions),
      line('Alimenti non negoziabili', data.foodNonNegotiables),
      line('Alcol', data.alcohol),
      line('Integratori attuali', data.supplements),
      line('Budget', data.budget ? BUDGET_LABELS[data.budget] : null),
    ],
    [
      '## Stile di vita',
      line('Lavoro', data.jobType ? JOB_LABELS[data.jobType] : null),
      line('Ore di sonno', data.sleepHours),
      line('Qualità del sonno (1-10)', data.sleepQuality),
      line('Stress percepito (1-10)', data.stressLevel),
      line('Attività quotidiana', data.dailyActivity),
    ],
    [
      '## Preferenze',
      line('Tipo di allenamento preferito', data.trainingStyle),
      line('Esercizi da evitare per preferenza', data.dislikedExercises),
      line('Da solo o in compagnia', data.soloOrGroup),
    ],
  ]

  return sections
    .map((s) => s.filter((l): l is string => l !== null).join('\n'))
    .filter((s) => s.split('\n').length > 1)
    .join('\n\n')
}
