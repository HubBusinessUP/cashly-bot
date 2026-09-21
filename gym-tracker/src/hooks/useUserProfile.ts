import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { AuthRequiredError } from '../lib/errors'
import type { Goal } from '../types'

export function useUserProfile() {
  const { user } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setGoal(null)
      setLoading(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setGoal((snap.data()?.goal as Goal) ?? null)
      setLoading(false)
    })
    return unsub
  }, [user])

  async function updateGoal(newGoal: Goal) {
    if (!user) throw new AuthRequiredError()
    await updateDoc(doc(db, 'users', user.uid), { goal: newGoal })
  }

  return { goal, loading, updateGoal }
}
