import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Inserisci email e password.')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
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
        <h1 className="mb-1 text-xl font-bold">Accedi</h1>
        <p className="mb-4 text-sm text-slate-500">Gym Tracker — il tuo diario allenamenti</p>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/forgot-password" className="text-brand-600 hover:underline">Password dimenticata?</Link>
          <Link to="/signup" className="text-brand-600 hover:underline">Crea account</Link>
        </div>
      </div>
    </div>
  )
}

export function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o password non corrette.'
    case 'auth/email-already-in-use':
      return 'Esiste già un account con questa email.'
    case 'auth/weak-password':
      return 'La password deve avere almeno 6 caratteri.'
    case 'auth/invalid-email':
      return 'Email non valida.'
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova più tardi.'
    default:
      return 'Si è verificato un errore. Riprova.'
  }
}
