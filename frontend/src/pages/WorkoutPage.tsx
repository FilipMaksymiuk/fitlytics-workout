import { useState, useEffect, useRef } from 'react'
import { createSession, endSession } from '../api/sessions'
import { getExercises } from '../api/exercises'
import { createSet, getSetsBySession, deleteSet } from '../api/sets'

interface MuscleGroup {
  id: number
  name: string
}

interface Exercise {
  id: number
  name: string
  primary_muscles: MuscleGroup[]
}

interface WorkoutSet {
  id: number
  exercise_id: number
  set_number: number
  weight_kg: number
  reps: number
}

interface Summary {
  duration: string
  sets: WorkoutSet[]
}

export default function WorkoutPage() {
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [muscleFilter, setMuscleFilter] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<number | ''>('')
  const [weight, setWeight] = useState<string>('')
  const [reps, setReps] = useState<number>(1)
  const [setError, setSetError] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)

  const getExerciseName = (id: number) =>
    exercises.find(e => e.id === id)?.name ?? `#${id}`

  const nextSetNumber = (exerciseId: number) => {
    const exerciseSets = sets.filter(s => s.exercise_id === exerciseId)
    if (exerciseSets.length === 0) return 1
    return Math.max(...exerciseSets.map(s => s.set_number)) + 1
  }
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (sessionId !== null) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      fetchExercises()
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionId])

  const fetchExercises = async (filter?: string) => {
    setLoadingExercises(true)
    try {
      const res = await getExercises(filter)
      setExercises(res.data)
      if (!selectedExercise && res.data.length > 0) setSelectedExercise(res.data[0].id)
    } finally {
      setLoadingExercises(false)
    }
  }

  const handleMuscleFilter = (val: string) => {
    setMuscleFilter(val)
    fetchExercises(val || undefined)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleStart = async () => {
    const res = await createSession({})
    setSessionId(res.data.id)
  }

  const handleAddSet = async () => {
    setSetError('')
    if (!selectedExercise) return
    try {
      await createSet({
        workout_session_id: sessionId,
        exercise_id: selectedExercise,
        set_number: nextSetNumber(selectedExercise as number),
        weight_kg: weight !== '' ? parseFloat(weight) : null,
        reps,
      })
      const res = await getSetsBySession(sessionId!)
      setSets(res.data)
    } catch {
      setSetError('Nie udało się dodać setu')
    }
  }

  const handleDeleteSet = async (id: number) => {
    try {
      await deleteSet(id)
      setSets(prev => prev.filter(s => s.id !== id))
    } catch {
      setSetError('Nie udało się usunąć setu')
    }
  }

  const handleEnd = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    await endSession(sessionId!, { duration_minutes: Math.round(seconds / 60) })
    setSummary({ duration: formatTime(seconds), sets })
    setSessionId(null)
  }

  const muscleGroups = [...new Set(exercises.flatMap(e => e.primary_muscles.map(m => m.name)))].filter(Boolean)

  const groupedSets = sets.reduce<Record<number, WorkoutSet[]>>((acc, s) => {
    if (!acc[s.exercise_id]) acc[s.exercise_id] = []
    acc[s.exercise_id].push(s)
    return acc
  }, {})

  if (summary) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={{ color: 'var(--accent)', textAlign: 'center' }}>Trening zakończony</h2>
          <p style={styles.text}>Czas trwania: <strong>{summary.duration}</strong></p>
          <p style={styles.text}>Liczba setów: <strong>{summary.sets.length}</strong></p>
          <p style={styles.text}>Ćwiczenia:</p>
          <ul style={{ color: '#ccc', paddingLeft: '1.25rem' }}>
            {[...new Set(summary.sets.map(s => s.exercise_id))].map(id => (
              <li key={id}>{getExerciseName(id)}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <button style={styles.buttonRed} onClick={handleStart}>Rozpocznij trening</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, textAlign: 'center' }}>
        <div style={styles.timer}>{formatTime(seconds)}</div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Dodaj set</h3>
        {loadingExercises ? (
          <p style={styles.text}>Ładowanie ćwiczeń...</p>
        ) : (
          <div style={styles.form}>
            <select style={styles.input} value={muscleFilter} onChange={e => handleMuscleFilter(e.target.value)}>
              <option value="">Wszystkie partie</option>
              {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select style={styles.input} value={selectedExercise} onChange={e => setSelectedExercise(Number(e.target.value))}>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <div style={styles.row}>
              <label style={styles.label}>Ciężar (kg)</label>
              <input style={styles.input} type="number" step={0.5} min={0} value={weight} placeholder="0" onChange={e => setWeight(e.target.value)} />
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Powtórzenia</label>
              <input style={styles.input} type="number" min={1} value={reps} onChange={e => setReps(Number(e.target.value))} />
            </div>
            {setError && <p style={{ color: 'var(--accent)', margin: 0 }}>{setError}</p>}
            <button style={styles.buttonRed} onClick={handleAddSet}>Dodaj set</button>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Sety bieżącego treningu</h3>
        {Object.keys(groupedSets).length === 0 && <p style={styles.text}>Brak setów</p>}
        {Object.entries(groupedSets).map(([exId, group]) => (
          <div key={exId} style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 600 }}>{getExerciseName(Number(exId))}</p>
            {[...group].sort((a, b) => a.set_number - b.set_number).map(s => (
              <div key={s.id} style={styles.setRow}>
                <span style={styles.text}>Set {s.set_number} — {s.weight_kg} kg × {s.reps} powt.</span>
                <button style={styles.deleteBtn} onClick={() => handleDeleteSet(s.id)}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 1rem 2rem' }}>
        <button style={{ ...styles.buttonRed, width: '100%' }} onClick={handleEnd}>Zakończ trening</button>
      </div>
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
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: '10px',
    padding: '1.5rem',
  },
  timer: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.05em',
  },
  sectionTitle: {
    color: '#fff',
    marginTop: 0,
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.6rem 0.8rem',
    color: '#fff',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  label: {
    color: '#aaa',
    fontSize: '0.85rem',
  },
  buttonRed: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
  },
  text: {
    color: '#ccc',
    margin: '0.25rem 0',
  },
  setRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0',
    borderBottom: '1px solid #333',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0 0.25rem',
  },
}
