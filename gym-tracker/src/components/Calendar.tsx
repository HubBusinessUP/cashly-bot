import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'
import type { Workout } from '../types'

interface CalendarProps {
  workouts: Workout[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export function Calendar({ workouts, selectedDate, onSelectDate }: CalendarProps) {
  const [month, setMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, Workout[]>()
    for (const w of workouts) {
      const list = map.get(w.date) ?? []
      list.push(w)
      map.set(w.date, list)
    }
    return map
  }, [workouts])

  const hasAnyWorkout = workouts.length > 0

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn-secondary" onClick={() => setMonth((m) => subMonths(m, 1))}>
          &larr; Prec
        </button>
        <h2 className="text-lg font-semibold capitalize">{format(month, 'MMMM yyyy', { locale: it })}</h2>
        <button type="button" className="btn-secondary" onClick={() => setMonth((m) => addMonths(m, 1))}>
          Succ &rarr;
        </button>
      </div>

      {!hasAnyWorkout && (
        <p className="mb-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200">
          Nessun allenamento registrato. Usa il modulo qui sotto per aggiungere il primo esercizio.
        </p>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayWorkouts = workoutsByDate.get(dateStr) ?? []
          const isSelected = selectedDate === dateStr
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={clsx(
                'flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-sm',
                isSameMonth(day, month)
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-transparent text-slate-400 dark:text-slate-600',
                isSelected && 'ring-2 ring-brand-500',
                isToday(day) && 'bg-brand-50 dark:bg-brand-950/40',
              )}
            >
              <span className={clsx(isSameDay(day, new Date()) && 'font-bold text-brand-600')}>
                {format(day, 'd')}
              </span>
              {dayWorkouts.length > 0 && (
                <span className="mt-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                  {dayWorkouts.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
