import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { Goal } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, goal: Goal) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signUp(email, password, goal) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: email.split('@')[0] })
        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          goal,
          createdAt: serverTimestamp(),
        })
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password)
      },
      async logOut() {
        await signOut(auth)
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
