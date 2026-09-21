import { z } from 'zod'

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(2, 'Il nome esercizio deve avere almeno 2 caratteri').max(100),
  libraryId: z.string().nullable(),
  sets: z.coerce.number({ invalid_type_error: 'Inserisci un numero di serie' }).min(1, 'Minimo 1 serie').max(100, 'Massimo 100 serie'),
  reps: z.coerce.number({ invalid_type_error: 'Inserisci un numero di ripetizioni' }).min(1, 'Minimo 1 ripetizione').max(1000, 'Massimo 1000 ripetizioni'),
  weight: z.coerce.number({ invalid_type_error: 'Inserisci un peso valido' }).min(0, 'Il peso non può essere negativo').max(2000, 'Peso troppo alto'),
  date: z.string().min(1, 'Seleziona una data'),
  notes: z.string().max(500, 'Note troppo lunghe (max 500 caratteri)').optional().default(''),
  completed: z.boolean().default(false),
})

export type ExerciseFormSchema = z.infer<typeof exerciseFormSchema>
