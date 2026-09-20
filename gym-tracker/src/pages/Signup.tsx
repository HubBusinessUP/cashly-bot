import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mapAuthError } from './Login'
import type { Goal } from '../types'

const GOALS: { value: Goal; label: string }[] = [
  { value: 'lose_weight', label: 'Perdere peso' },
  { value: 'build_muscle', label: 'Aumentare massa muscolare' },
  { value: 'strength', label: 'Aumentare la forza' },
  { value: 'endurance', label: 'Migliorare la resistenza' },
  { value: 'maintain', label: 'Mantenimento' },
]

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [goal, setGoal] = useState<Goal>('build_muscle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Inserisci email e password.')
      return
    }
    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, goal)
      navigate('/')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold">Crea account</h1>
        <p className="mb-4 text-sm text-slate-500">Inizia a tracciare i tuoi allenamenti</p>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="goal">Obiettivo</label>
            <select id="goal" className="input" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creazione...' : 'Crea account'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          Hai già un account? <Link to="/login" className="text-brand-600 hover:underline">Accedi</Link>
        </div>
      </div>
    </div>
  )
}
