import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { AuthRequiredError } from '../lib/errors'
import type { OnboardingData } from '../types'

export function useOnboarding() {
  const { user } = useAuth()
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setOnboarding(null)
      setLoading(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setOnboarding((snap.data()?.onboarding as OnboardingData) ?? null)
      setLoading(false)
    })
    return unsub
  }, [user])

  async function saveOnboarding(data: OnboardingData): Promise<void> {
    if (!user) throw new AuthRequiredError()
    await updateDoc(doc(db, 'users', user.uid), { onboarding: data })
  }

  return { onboarding, loading, saveOnboarding, completed: onboarding != null }
}
