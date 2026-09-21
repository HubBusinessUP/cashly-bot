import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { exerciseFormSchema, type ExerciseFormSchema } from '../lib/schema'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary'

const SORTED_LIBRARY = [...EXERCISE_LIBRARY].sort((a, b) => a.name.localeCompare(b.name))

interface ExerciseFormProps {
  defaultValues?: Partial<ExerciseFormSchema>
  submitLabel?: string
  onSubmit: (values: ExerciseFormSchema) => Promise<void> | void
  onCancel?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function ExerciseForm({ defaultValues, submitLabel = 'Salva', onSubmit, onCancel }: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ExerciseFormSchema>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: '',
      libraryId: null,
      sets: 3,
      reps: 10,
      weight: 0,
      date: today(),
      notes: '',
      completed: false,
      ...defaultValues,
    },
  })

  async function submit(values: ExerciseFormSchema) {
    try {
      await onSubmit(values)
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Errore durante il salvataggio.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="libraryId">
          Esercizio dalla libreria (opzionale)
        </label>
        <select id="libraryId" className="input" {...register('libraryId')}>
          <option value="">Nessuno — esercizio personalizzato</option>
          {SORTED_LIBRARY.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.category})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="name">
          Nome esercizio
        </label>
        <input id="name" className="input" {...register('name')} placeholder="es. Squat con bilanciere" />
        {errors.name && <p className="error-text">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="sets">
            Serie
          </label>
          <input id="sets" type="number" className="input" {...register('sets')} />
          {errors.sets && <p className="error-text">{errors.sets.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reps">
            Ripetizioni
          </label>
          <input id="reps" type="number" className="input" {...register('reps')} />
          {errors.reps && <p className="error-text">{errors.reps.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="weight">
            Peso (kg)
          </label>
          <input id="weight" type="number" step="0.5" className="input" {...register('weight')} />
          {errors.weight && <p className="error-text">{errors.weight.message}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="date">
          Data
        </label>
        <input id="date" type="date" className="input" {...register('date')} />
        {errors.date && <p className="error-text">{errors.date.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Note
        </label>
        <textarea id="notes" className="input" rows={3} {...register('notes')} placeholder="Sensazioni, tecnica, infortuni..." />
        {errors.notes && <p className="error-text">{errors.notes.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input id="completed" type="checkbox" className="h-4 w-4 rounded" {...register('completed')} />
        <label htmlFor="completed" className="text-sm text-slate-700 dark:text-slate-300">
          Allenamento completato
        </label>
      </div>

      {errors.root && <p className="error-text">{errors.root.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Annulla
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
