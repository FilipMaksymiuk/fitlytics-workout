import { useState, useEffect } from 'react'
import { getSessions, getSession } from '../api/sessions'

interface SetItem {
  id: number
  set_number: number
  weight_kg: number
  reps: number
  duration_seconds?: number
  distance_km?: number
  exercise_name: string
}

interface Session {
  id: number
  date: string
  duration_minutes?: number
  notes?: string
}

interface SessionDetail {
  id: number
  date: string
  duration_minutes?: number
  workout_sets: SetItem[]
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, SessionDetail | null>>({})
  const [loadingDetail, setLoadingDetail] = useState<Record<number, boolean>>({})

  useEffect(() => {
    getSessions()
      .then(res => setSessions(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: number) => {
    if (expanded[id] !== undefined) {
      setExpanded(prev => { const next = { ...prev }; delete next[id]; return next })
      return
    }
    setLoadingDetail(prev => ({ ...prev, [id]: true }))
    try {
      const res = await getSession(id)
      setExpanded(prev => ({ ...prev, [id]: res.data }))
    } finally {
      setLoadingDetail(prev => ({ ...prev, [id]: false }))
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  if (loading) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.spinner} />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa', fontSize: '1.1rem' }}>Brak treningów. Zacznij swój pierwszy trening!</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Historia treningów</h2>
      {sessions.map(session => {
        const detail = expanded[session.id]
        const isExpanded = detail !== undefined
        const groupedSets = detail
          ? detail.workout_sets.reduce<Record<string, SetItem[]>>((acc, s) => {
              const key = s.exercise_name || `#${s.exercise_id}`
              if (!acc[key]) acc[key] = []
              acc[key].push(s)
              return acc
            }, {})
          : {}

        return (
          <div key={session.id} style={styles.card}>
            <p style={styles.date}>{formatDate(session.date)}</p>
            {session.duration_minutes != null && (
              <p style={styles.meta}>Czas trwania: {session.duration_minutes} min</p>
            )}
            {session.notes && (
              <p style={styles.meta}>Notatki: {session.notes}</p>
            )}
            <button style={styles.detailBtn} onClick={() => handleToggle(session.id)}>
              {loadingDetail[session.id] ? 'Ładowanie...' : isExpanded ? 'Zwiń' : 'Szczegóły'}
            </button>

            {isExpanded && detail && (
              <div style={styles.details}>
                {Object.entries(groupedSets).map(([name, sets]) => (
                  <div key={name} style={{ marginBottom: '0.75rem' }}>
                    <p style={styles.exerciseName}>{name}</p>
                    {sets.map(s => (
                      <div key={s.id} style={styles.setRow}>
                        <span style={styles.setText}>Set {s.set_number}</span>
                        {s.weight_kg != null && s.reps != null && (
                          <span style={styles.setText}>{s.weight_kg} kg × {s.reps} powt.</span>
                        )}
                        {s.duration_seconds != null && (
                          <span style={styles.setText}>{s.duration_seconds} sek.</span>
                        )}
                        {s.distance_km != null && (
                          <span style={styles.setText}>{s.distance_km} km</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
  },
  heading: {
    color: '#fff',
    margin: '0.5rem 0',
  },
  card: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '1.25rem',
  },
  date: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    margin: '0 0 0.5rem',
  },
  meta: {
    color: '#aaa',
    margin: '0.2rem 0',
    fontSize: '0.9rem',
  },
  detailBtn: {
    marginTop: '0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #e63946',
    borderRadius: '6px',
    color: '#e63946',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  details: {
    marginTop: '1rem',
    borderTop: '1px solid #333',
    paddingTop: '1rem',
  },
  exerciseName: {
    color: '#e63946',
    fontWeight: 600,
    margin: '0 0 0.4rem',
  },
  setRow: {
    display: 'flex',
    gap: '1rem',
    padding: '0.25rem 0',
    borderBottom: '1px solid #333',
  },
  setText: {
    color: '#ccc',
    fontSize: '0.9rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #333',
    borderTop: '4px solid #e63946',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
