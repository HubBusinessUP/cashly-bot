import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambia tema chiaro/scuro"
      className="rounded-lg border border-slate-300 p-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
    </button>
  )
}
