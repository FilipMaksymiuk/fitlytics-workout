import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlan } from '../api/plans'
import { createSession, endSession } from '../api/sessions'
import { createSet } from '../api/sets'

interface PlanSet {
  id: number
  set_number: number
  planned_weight_kg: number | null
  planned_reps: number | null
}

interface PlanExercise {
  id: number
  exercise_id: number
  exercise_name: string
  order_index: number
  sets: PlanSet[]
}

interface Plan {
  id: number
  name: string
  exercises: PlanExercise[]
}

type SetStatus = 'pending' | 'done' | 'skipped'

interface SetState {
  status: SetStatus
  actual_weight: string
  actual_reps: string
}

export default function PlanExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [setStates, setSetStates] = useState<Record<number, SetState>>({})
  const [seconds, setSeconds] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!id || initializedRef.current) return
    initializedRef.current = true

    Promise.all([
      getPlan(Number(id)).then(r => {
        const p: Plan = r.data
        setPlan(p)
        const initial: Record<number, SetState> = {}
        for (const ex of p.exercises) {
          for (const s of ex.sets) {
            initial[s.id] = {
              status: 'pending',
              actual_weight: s.planned_weight_kg != null ? String(s.planned_weight_kg) : '',
              actual_reps: s.planned_reps != null ? String(s.planned_reps) : '',
            }
          }
        }
        setSetStates(initial)
      }),
      createSession({}).then(r => setSessionId(r.data.id)),
    ])

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const markDone = (setId: number) =>
    setSetStates(prev => ({ ...prev, [setId]: { ...prev[setId], status: 'done' } }))

  const markSkipped = (setId: number) =>
    setSetStates(prev => ({ ...prev, [setId]: { ...prev[setId], status: 'skipped' } }))

  const markPending = (setId: number) =>
    setSetStates(prev => ({ ...prev, [setId]: { ...prev[setId], status: 'pending' } }))

  const updateField = (setId: number, field: 'actual_weight' | 'actual_reps', val: string) =>
    setSetStates(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: val } }))

  const handleFinish = async () => {
    if (!sessionId || !plan) return
    setFinishing(true)
    setError('')
    try {
      if (timerRef.current) clearInterval(timerRef.current)

      const doneSets: Array<{ exercise_id: number; set_number: number; weight_kg: number | null; reps: number | null }> = []

      for (const ex of plan.exercises) {
        let setNum = 1
        for (const ps of ex.sets) {
          const st = setStates[ps.id]
          if (st?.status === 'done') {
            doneSets.push({
              exercise_id: ex.exercise_id,
              set_number: setNum++,
              weight_kg: st.actual_weight !== '' ? parseFloat(st.actual_weight) : null,
              reps: st.actual_reps !== '' ? parseInt(st.actual_reps) : null,
            })
          }
        }
      }

      await Promise.allSettled(
        doneSets.map(ds =>
          createSet({
            workout_session_id: sessionId,
            exercise_id: ds.exercise_id,
            set_number: ds.set_number,
            weight_kg: ds.weight_kg,
            reps: ds.reps,
          })
        )
      )

      await endSession(sessionId, { duration_minutes: Math.max(1, Math.round(seconds / 60)) })
      navigate('/history')
    } catch {
      setError('Nie udało się zakończyć treningu')
      setFinishing(false)
    }
  }

  if (!plan) return <div style={{ ...s.page, color: '#aaa' }}>Ładowanie planu...</div>

  const doneCount = Object.values(setStates).filter(st => st.status === 'done').length
  const totalCount = Object.values(setStates).length

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.planName}>{plan.name}</div>
          <div style={s.progress}>{doneCount}/{totalCount} setów wykonanych</div>
        </div>
        <div style={s.timer}>{formatTime(seconds)}</div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {plan.exercises.map(ex => (
        <div key={ex.id} style={s.card}>
          <div style={s.exerciseName}>{ex.exercise_name}</div>
          {ex.sets.map(ps => {
            const st = setStates[ps.id]
            if (!st) return null
            return (
              <div key={ps.id} style={s.setBlock}>
                <div style={s.setInfo}>
                  <span style={s.setLabel}>Set {ps.set_number}</span>
                  <span style={s.planned}>
                    {ps.planned_weight_kg != null ? `${ps.planned_weight_kg} kg` : '—'}
                    {ps.planned_reps != null ? ` × ${ps.planned_reps} powt.` : ''}
                  </span>
                </div>

                {st.status === 'pending' && (
                  <div style={s.actions}>
                    <button style={s.doneBtn} onClick={() => markDone(ps.id)}>✓ Udało się</button>
                    <button style={s.skipBtn} onClick={() => markSkipped(ps.id)}>✗ Pomiń</button>
                  </div>
                )}

                {st.status === 'done' && (
                  <div style={s.doneBlock}>
                    <div style={s.doneInputs}>
                      <div style={s.inputGroup}>
                        <label style={s.inputLabel}>Ciężar (kg)</label>
                        <input
                          style={s.actualInput}
                          type="number"
                          step={0.5}
                          min={0}
                          value={st.actual_weight}
                          onChange={e => updateField(ps.id, 'actual_weight', e.target.value)}
                        />
                      </div>
                      <div style={s.inputGroup}>
                        <label style={s.inputLabel}>Powtórzenia</label>
                        <input
                          style={s.actualInput}
                          type="number"
                          min={1}
                          value={st.actual_reps}
                          onChange={e => updateField(ps.id, 'actual_reps', e.target.value)}
                        />
                      </div>
                    </div>
                    <button style={s.undoBtn} onClick={() => markPending(ps.id)}>Cofnij</button>
                  </div>
                )}

                {st.status === 'skipped' && (
                  <div style={s.skippedBlock}>
                    <span style={s.skippedText}>Pominięto</span>
                    <button style={s.undoBtn} onClick={() => markPending(ps.id)}>Cofnij</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <button
        style={{ ...s.finishBtn, opacity: finishing ? 0.7 : 1 }}
        onClick={handleFinish}
        disabled={finishing}
      >
        {finishing ? 'Zapisywanie...' : 'Zakończ trening'}
      </button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { background: '#1a1a1a', minHeight: '100vh', padding: '16px', color: '#f0f0f0', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', background: '#2a2a2a', borderRadius: '10px', padding: '16px 20px' },
  planName: { fontWeight: 700, fontSize: '18px', color: 'var(--accent)', marginBottom: '4px' },
  progress: { fontSize: '13px', color: '#aaa' },
  timer: { fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' },
  card: { background: '#2a2a2a', borderRadius: '10px', padding: '16px', marginBottom: '12px' },
  exerciseName: { color: 'var(--accent)', fontWeight: 600, fontSize: '15px', marginBottom: '12px' },
  setBlock: { borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' },
  setInfo: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' },
  setLabel: { color: '#aaa', fontSize: '13px', minWidth: '42px' },
  planned: { color: '#ccc', fontSize: '14px' },
  actions: { display: 'flex', gap: '8px' },
  doneBtn: { background: '#1a6e3c', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer' },
  skipBtn: { background: '#3a1a1a', color: '#e74c3c', border: '1px solid #c0392b', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer' },
  doneBlock: { background: '#1a2e1a', borderRadius: '6px', padding: '10px', display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' as const },
  doneInputs: { display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' as const },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  inputLabel: { color: '#888', fontSize: '11px' },
  actualInput: { background: '#2a2a2a', border: '1px solid #2ecc71', borderRadius: '6px', color: '#fff', padding: '6px 8px', fontSize: '14px', width: '80px' },
  skippedBlock: { display: 'flex', alignItems: 'center', gap: '12px' },
  skippedText: { color: '#888', fontSize: '13px', fontStyle: 'italic' },
  undoBtn: { background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' },
  finishBtn: { width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' },
  error: { color: '#e74c3c', fontSize: '13px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(231,76,60,0.1)', borderRadius: '6px' },
}
