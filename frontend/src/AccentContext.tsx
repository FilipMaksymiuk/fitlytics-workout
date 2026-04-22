import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export const ACCENT_COLORS = [
  { name: 'Czerwony',     value: '#e63946' },
  { name: 'Niebieski',    value: '#3b82f6' },
  { name: 'Zielony',      value: '#22c55e' },
  { name: 'Żółty',        value: '#eab308' },
  { name: 'Fioletowy',    value: '#a855f7' },
  { name: 'Pomarańczowy', value: '#f97316' },
  { name: 'Różowy',       value: '#ec4899' },
  { name: 'Cyjan',        value: '#06b6d4' },
  { name: 'Turkusowy',    value: '#14b8a6' },
]

const DEFAULT = '#e63946'
const LS_KEY = 'accent_color'

interface AccentCtx {
  accent: string
  setAccent: (color: string) => void
}

const AccentContext = createContext<AccentCtx>({ accent: DEFAULT, setAccent: () => {} })

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState(() => localStorage.getItem(LS_KEY) ?? DEFAULT)

  const setAccent = (color: string) => {
    localStorage.setItem(LS_KEY, color)
    setAccentState(color)
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}

export const useAccent = () => useContext(AccentContext)
