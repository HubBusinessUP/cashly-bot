import { useMemo } from 'react'
import type { ExerciseLog } from '../types'

export interface ProgressStats {
  totalSessions: number
  avgReps: number
  maxWeight: number
  totalVolume: number
  currentStreakDays: number
}

/** Derives progress statistics from exercise logs. Recomputes whenever the list changes. */
export function useProgressStats(exercises: ExerciseLog[]): ProgressStats {
  return useMemo(() => {
    if (exercises.length === 0) {
      return { totalSessions: 0, avgReps: 0, maxWeight: 0, totalVolume: 0, currentStreakDays: 0 }
    }

    const totalReps = exercises.reduce((sum, e) => sum + e.reps, 0)
    const maxWeight = Math.max(...exercises.map((e) => e.weight))
    const totalVolume = exercises.reduce((sum, e) => sum + e.reps * e.sets * e.weight, 0)

    const uniqueDates = Array.from(new Set(exercises.map((e) => e.date))).sort().reverse()
    let streak = 0
    let cursor = new Date()
    for (const dateStr of uniqueDates) {
      const expected = cursor.toISOString().slice(0, 10)
      if (dateStr === expected) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else if (streak === 0 && isYesterdayOrToday(dateStr)) {
        streak += 1
        cursor = new Date(dateStr)
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    return {
      totalSessions: exercises.length,
      avgReps: Math.round((totalReps / exercises.length) * 10) / 10,
      maxWeight,
      totalVolume: Math.round(totalVolume),
      currentStreakDays: streak,
    }
  }, [exercises])
}

function isYesterdayOrToday(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return dateStr === today || dateStr === yesterday
}
