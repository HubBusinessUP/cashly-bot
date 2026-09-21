import type { ProgressStats } from '../hooks/useProgressStats'

export function StatsCards({ stats }: { stats: ProgressStats }) {
  const items = [
    { label: 'Sessioni registrate', value: stats.totalSessions },
    { label: 'Ripetizioni medie', value: stats.avgReps },
    { label: 'Peso massimo (kg)', value: stats.maxWeight },
    { label: 'Volume totale (kg)', value: stats.totalVolume.toLocaleString('it-IT') },
    { label: 'Giorni consecutivi', value: stats.currentStreakDays },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="card">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
