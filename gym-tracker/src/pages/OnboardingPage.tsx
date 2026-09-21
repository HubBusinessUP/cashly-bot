import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../hooks/useOnboarding'
import { buildOnboardingSummary } from '../lib/onboardingExport'
import { sanitizeText } from '../lib/sanitize'
import type { OnboardingData } from '../types'

type FormValues = Omit<OnboardingData, 'completedAt'>

const EMPTY_VALUES: FormValues = {
  age: null, sex: null, heightCm: null, weightKg: null, targetWeightKg: null,
  primaryGoal: null, secondaryGoal: '', targetDate: '', pastFailureReason: '',
  trainingMonths: null, level: null, daysPerWeek: null, sessionMinutes: null,
  location: null, equipment: '', strongExercises: '', avoidExercises: '',
  injuries: '', painMovements: '', conditions: '', medications: '', lastCheckup: '',
  waistCm: null, hipsCm: null, chestCm: null, armCm: null, bodyFatPercent: null,
  mealsPerDay: null, mealControl: '', foodExclusions: '', foodNonNegotiables: '',
  alcohol: '', supplements: '', budget: null,
  jobType: null, sleepHours: null, sleepQuality: null, stressLevel: null, dailyActivity: '',
  trainingStyle: '', dislikedExercises: '', soloOrGroup: '',
}

const TEXT_MAX = 1000

export function OnboardingPage() {
  const navigate = useNavigate()
  const { onboarding, loading, saveOnboarding } = useOnboarding()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: EMPTY_VALUES })

  useEffect(() => {
    if (onboarding) reset(onboarding)
  }, [onboarding, reset])

  async function onSubmit(values: FormValues) {
    setError(null)
    if (!values.age || !values.sex || !values.heightCm || !values.weightKg || !values.primaryGoal || !values.level || !values.daysPerWeek || !values.location) {
      setError('Compila almeno età, sesso, altezza, peso, obiettivo primario, livello, giorni/settimana e dove ti alleni: sono i dati minimi per costruire un piano.')
      return
    }
    setSubmitting(true)
    try {
      const clean: OnboardingData = {
        ...values,
        secondaryGoal: sanitizeText(values.secondaryGoal, TEXT_MAX),
        pastFailureReason: sanitizeText(values.pastFailureReason, TEXT_MAX),
        equipment: sanitizeText(values.equipment, TEXT_MAX),
        strongExercises: sanitizeText(values.strongExercises, TEXT_MAX),
        avoidExercises: sanitizeText(values.avoidExercises, TEXT_MAX),
        injuries: sanitizeText(values.injuries, TEXT_MAX),
        painMovements: sanitizeText(values.painMovements, TEXT_MAX),
        conditions: sanitizeText(values.conditions, TEXT_MAX),
        medications: sanitizeText(values.medications, TEXT_MAX),
        lastCheckup: sanitizeText(values.lastCheckup, 200),
        mealControl: sanitizeText(values.mealControl, TEXT_MAX),
        foodExclusions: sanitizeText(values.foodExclusions, TEXT_MAX),
        foodNonNegotiables: sanitizeText(values.foodNonNegotiables, TEXT_MAX),
        alcohol: sanitizeText(values.alcohol, 200),
        supplements: sanitizeText(values.supplements, TEXT_MAX),
        dailyActivity: sanitizeText(values.dailyActivity, TEXT_MAX),
        trainingStyle: sanitizeText(values.trainingStyle, TEXT_MAX),
        dislikedExercises: sanitizeText(values.dislikedExercises, TEXT_MAX),
        soloOrGroup: sanitizeText(values.soloOrGroup, 200),
        completedAt: onboarding?.completedAt ?? Date.now(),
      }
      await saveOnboarding(clean)
      setSummary(buildOnboardingSummary(clean))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copySummary() {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
    } catch {
      // clipboard API unavailable — the text is still shown below for manual copy
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Caricamento...</p>

  if (summary) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="card">
          <h1 className="text-xl font-bold">Questionario salvato</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Copia il riepilogo qui sotto e incollalo in chat al tuo coach per ricevere la scheda di allenamento
            settimanale e le linee guida nutrizionali su misura.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-primary" onClick={copySummary}>Copia riepilogo</button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Vai alla dashboard</button>
          </div>
          <textarea readOnly className="input mt-3" rows={14} value={summary} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Questionario iniziale</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rispondi con i dati che hai: più informazioni dai, più il piano che riceverai sarà su misura. I campi con *
          sono il minimo indispensabile.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <section className="card space-y-3">
          <h2 className="font-semibold">Dati generali</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="age">Età *</label>
              <input id="age" type="number" className="input" {...register('age', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="sex">Sesso *</label>
              <select id="sex" className="input" {...register('sex')}>
                <option value="">Seleziona</option>
                <option value="male">Uomo</option>
                <option value="female">Donna</option>
                <option value="other">Altro</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="heightCm">Altezza (cm) *</label>
              <input id="heightCm" type="number" className="input" {...register('heightCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="weightKg">Peso attuale (kg) *</label>
              <input id="weightKg" type="number" step="0.1" className="input" {...register('weightKg', { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="targetWeightKg">Peso in cui ti sei sentito meglio (kg, se diverso)</label>
              <input id="targetWeightKg" type="number" step="0.1" className="input" {...register('targetWeightKg', { valueAsNumber: true })} />
            </div>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Obiettivo</h2>
          <div>
            <label className="label" htmlFor="primaryGoal">Obiettivo primario *</label>
            <select id="primaryGoal" className="input" {...register('primaryGoal')}>
              <option value="">Seleziona</option>
              <option value="lose_weight">Perdere peso</option>
              <option value="build_muscle">Aumentare massa muscolare</option>
              <option value="strength">Aumentare la forza</option>
              <option value="endurance">Migliorare la resistenza</option>
              <option value="maintain">Mantenimento</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="secondaryGoal">Obiettivo secondario</label>
            <input id="secondaryGoal" className="input" {...register('secondaryGoal')} />
          </div>
          <div>
            <label className="label" htmlFor="targetDate">Scadenza/evento target</label>
            <input id="targetDate" type="date" className="input" {...register('targetDate')} />
          </div>
          <div>
            <label className="label" htmlFor="pastFailureReason">Cosa ti ha fatto fallire in passato</label>
            <textarea id="pastFailureReason" className="input" rows={2} {...register('pastFailureReason')} />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Allenamento</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="trainingMonths">Mesi di esperienza</label>
              <input id="trainingMonths" type="number" className="input" {...register('trainingMonths', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="level">Livello *</label>
              <select id="level" className="input" {...register('level')}>
                <option value="">Seleziona</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="daysPerWeek">Giorni/settimana *</label>
              <input id="daysPerWeek" type="number" min={1} max={7} className="input" {...register('daysPerWeek', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="sessionMinutes">Minuti a sessione</label>
              <input id="sessionMinutes" type="number" className="input" {...register('sessionMinutes', { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location">Dove ti alleni *</label>
            <select id="location" className="input" {...register('location')}>
              <option value="">Seleziona</option>
              <option value="full_gym">Palestra attrezzata</option>
              <option value="basic_gym">Palestra base</option>
              <option value="home">Casa</option>
              <option value="both">Entrambi</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="equipment">Attrezzatura disponibile</label>
            <textarea id="equipment" className="input" rows={2} {...register('equipment')} />
          </div>
          <div>
            <label className="label" htmlFor="strongExercises">Esercizi che sai fare bene</label>
            <textarea id="strongExercises" className="input" rows={2} {...register('strongExercises')} />
          </div>
          <div>
            <label className="label" htmlFor="avoidExercises">Esercizi che eviti o non sai fare</label>
            <textarea id="avoidExercises" className="input" rows={2} {...register('avoidExercises')} />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Salute e limitazioni</h2>
          <div>
            <label className="label" htmlFor="injuries">Infortuni pregressi o attuali</label>
            <textarea id="injuries" className="input" rows={2} {...register('injuries')} />
          </div>
          <div>
            <label className="label" htmlFor="painMovements">Dolori con certi movimenti</label>
            <textarea id="painMovements" className="input" rows={2} {...register('painMovements')} />
          </div>
          <div>
            <label className="label" htmlFor="conditions">Patologie note</label>
            <textarea id="conditions" className="input" rows={2} {...register('conditions')} />
          </div>
          <div>
            <label className="label" htmlFor="medications">Farmaci</label>
            <textarea id="medications" className="input" rows={2} {...register('medications')} />
          </div>
          <div>
            <label className="label" htmlFor="lastCheckup">Ultimo controllo medico/analisi</label>
            <input id="lastCheckup" className="input" {...register('lastCheckup')} />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Misure corporee (facoltativo)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="waistCm">Girovita (cm)</label>
              <input id="waistCm" type="number" step="0.5" className="input" {...register('waistCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="hipsCm">Girofianchi (cm)</label>
              <input id="hipsCm" type="number" step="0.5" className="input" {...register('hipsCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="chestCm">Girotorace (cm)</label>
              <input id="chestCm" type="number" step="0.5" className="input" {...register('chestCm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="armCm">Girobraccio (cm)</label>
              <input id="armCm" type="number" step="0.5" className="input" {...register('armCm', { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="bodyFatPercent">% grasso stimata</label>
              <input id="bodyFatPercent" type="number" step="0.5" className="input" {...register('bodyFatPercent', { valueAsNumber: true })} />
            </div>
          </div>
          <p className="text-xs text-slate-500">Le foto del fisico si caricano nella sezione Progressi.</p>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Alimentazione</h2>
          <div>
            <label className="label" htmlFor="mealsPerDay">Pasti al giorno</label>
            <input id="mealsPerDay" type="number" className="input" {...register('mealsPerDay', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="label" htmlFor="mealControl">Chi cucina / controllo sul cibo</label>
            <input id="mealControl" className="input" {...register('mealControl')} />
          </div>
          <div>
            <label className="label" htmlFor="foodExclusions">Alimenti esclusi (allergie, intolleranze, scelte)</label>
            <textarea id="foodExclusions" className="input" rows={2} {...register('foodExclusions')} />
          </div>
          <div>
            <label className="label" htmlFor="foodNonNegotiables">Alimenti che non vuoi togliere</label>
            <textarea id="foodNonNegotiables" className="input" rows={2} {...register('foodNonNegotiables')} />
          </div>
          <div>
            <label className="label" htmlFor="alcohol">Alcol (frequenza e quantità)</label>
            <input id="alcohol" className="input" {...register('alcohol')} />
          </div>
          <div>
            <label className="label" htmlFor="supplements">Integratori che già usi</label>
            <textarea id="supplements" className="input" rows={2} {...register('supplements')} />
          </div>
          <div>
            <label className="label" htmlFor="budget">Budget cibo/integratori</label>
            <select id="budget" className="input" {...register('budget')}>
              <option value="">Seleziona</option>
              <option value="low">Basso</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Stile di vita e recupero</h2>
          <div>
            <label className="label" htmlFor="jobType">Lavoro</label>
            <select id="jobType" className="input" {...register('jobType')}>
              <option value="">Seleziona</option>
              <option value="sedentary">Sedentario</option>
              <option value="standing">In piedi</option>
              <option value="physical">Fisico</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="sleepHours">Ore di sonno</label>
              <input id="sleepHours" type="number" step="0.5" className="input" {...register('sleepHours', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="sleepQuality">Qualità sonno (1-10)</label>
              <input id="sleepQuality" type="number" min={1} max={10} className="input" {...register('sleepQuality', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label" htmlFor="stressLevel">Stress (1-10)</label>
              <input id="stressLevel" type="number" min={1} max={10} className="input" {...register('stressLevel', { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="dailyActivity">Attività quotidiana fuori palestra</label>
            <input id="dailyActivity" className="input" {...register('dailyActivity')} />
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Preferenze</h2>
          <div>
            <label className="label" htmlFor="trainingStyle">Tipo di allenamento che ti piace</label>
            <input id="trainingStyle" className="input" {...register('trainingStyle')} />
          </div>
          <div>
            <label className="label" htmlFor="dislikedExercises">Cosa odi fare / vuoi evitare</label>
            <textarea id="dislikedExercises" className="input" rows={2} {...register('dislikedExercises')} />
          </div>
          <div>
            <label className="label" htmlFor="soloOrGroup">Da solo o in compagnia</label>
            <input id="soloOrGroup" className="input" {...register('soloOrGroup')} />
          </div>
        </section>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Salvataggio...' : 'Salva questionario'}
        </button>
      </form>
    </div>
  )
}
