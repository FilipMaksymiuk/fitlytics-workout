import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, createPlan, updatePlan, deletePlan } from '../api/plans'
import type { PlanExercisePayload } from '../api/plans'
import { getExercises } from '../api/exercises'

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
  description?: string
  created_at: string
  exercises: PlanExercise[]
}

interface Exercise {
  id: number
  name: string
}

interface SetInput {
  weight: string
  reps: string
}

interface ExerciseInput {
  exercise_id: number
  sets: SetInput[]
}

const pluralSety = (n: number) => n === 1 ? 'set' : (n >= 2 && n <= 4) ? 'sety' : 'setów'

export default function PlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [planExercises, setPlanExercises] = useState<ExerciseInput[]>([])

  const [pickedExerciseId, setPickedExerciseId] = useState<number | ''>('')
  const [pickedSetCount, setPickedSetCount] = useState(3)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getPlans().then(r => setPlans(r.data)),
      getExercises().then(r => setExercises(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const fetchPlans = () =>
    getPlans().then(r => setPlans(r.data))

  const openCreate = () => {
    setEditingId(null)
    setFormName('')
    setFormDesc('')
    setPlanExercises([])
    setPickedExerciseId(exercises[0]?.id ?? '')
    setPickedSetCount(3)
    setError('')
    setShowForm(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id)
    setFormName(plan.name)
    setFormDesc(plan.description ?? '')
    setPlanExercises(
      plan.exercises.map(pe => ({
        exercise_id: pe.exercise_id,
        sets: pe.sets.map(s => ({
          weight: s.planned_weight_kg != null ? String(s.planned_weight_kg) : '',
          reps: s.planned_reps != null ? String(s.planned_reps) : '',
        })),
      }))
    )
    setPickedExerciseId(exercises[0]?.id ?? '')
    setPickedSetCount(3)
    setError('')
    setShowForm(true)
  }

  const addExerciseToPlan = () => {
    if (!pickedExerciseId) return
    const sets: SetInput[] = Array.from({ length: pickedSetCount }, () => ({ weight: '', reps: '' }))
    setPlanExercises(prev => [...prev, { exercise_id: Number(pickedExerciseId), sets }])
  }

  const removeExercise = (idx: number) =>
    setPlanExercises(prev => prev.filter((_, i) => i !== idx))

  const updateSetField = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) =>
    setPlanExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: val }),
      }
    ))

  const buildPayload = (): PlanExercisePayload[] =>
    planExercises.map((ex, idx) => ({
      exercise_id: ex.exercise_id,
      order_index: idx,
      sets: ex.sets.map((s, j) => ({
        set_number: j + 1,
        planned_weight_kg: s.weight !== '' ? parseFloat(s.weight) : null,
        planned_reps: s.reps !== '' ? parseInt(s.reps) : null,
      })),
    }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    setSaving(true)
    setError('')
    try {
      const exercises_payload = buildPayload()
      if (editingId) {
        await updatePlan(editingId, { name: formName, description: formDesc || undefined, exercises: exercises_payload })
      } else {
        await createPlan({ name: formName, description: formDesc || undefined, exercises: exercises_payload })
      }
      await fetchPlans()
      setShowForm(false)
    } catch {
      setError('Nie udało się zapisać planu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Na pewno usunąć plan?')) return
    try {
      await deletePlan(id)
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Nie udało się usunąć planu')
    }
  }

  const getExerciseName = (id: number) =>
    exercises.find(e => e.id === id)?.name ?? `#${id}`

  if (loading) return <div style={{ ...s.page, color: '#aaa', padding: '24px' }}>Ładowanie...</div>

  return (
    <div style={s.page}>
      {error && <div style={s.error}>{error}</div>}

      {showForm ? (
        <div style={s.card}>
          <div style={s.title}>{editingId ? 'Edytuj plan' : 'Nowy plan treningowy'}</div>
          <form onSubmit={handleSave}>
            <div style={s.field}>
              <label style={s.label}>Nazwa planu</label>
              <input style={s.input} value={formName} onChange={e => setFormName(e.target.value)} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Opis (opcjonalne)</label>
              <textarea style={s.textarea} value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>

            <div style={s.sectionLabel}>Ćwiczenia</div>

            {planExercises.map((ex, exIdx) => (
              <div key={exIdx} style={s.exerciseBlock}>
                <div style={s.exerciseHeader}>
                  <span style={s.exerciseName}>{getExerciseName(ex.exercise_id)}</span>
                  <button type="button" style={s.removeBtn} onClick={() => removeExercise(exIdx)}>Usuń</button>
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} style={s.setRow}>
                    <span style={s.setLabel}>Set {setIdx + 1}</span>
                    <input
                      style={s.setInput}
                      type="number"
                      step={0.5}
                      min={0}
                      placeholder="kg"
                      value={set.weight}
                      onChange={e => updateSetField(exIdx, setIdx, 'weight', e.target.value)}
                    />
                    <span style={s.setUnit}>kg</span>
                    <input
                      style={s.setInput}
                      type="number"
                      min={1}
                      placeholder="powt."
                      value={set.reps}
                      onChange={e => updateSetField(exIdx, setIdx, 'reps', e.target.value)}
                    />
                    <span style={s.setUnit}>powt.</span>
                  </div>
                ))}
              </div>
            ))}

            <div style={s.addExRow}>
              <select
                style={s.select}
                value={pickedExerciseId}
                onChange={e => setPickedExerciseId(Number(e.target.value))}
              >
                {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              <select
                style={{ ...s.select, width: '80px' }}
                value={pickedSetCount}
                onChange={e => setPickedSetCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {pluralSety(n)}</option>)}
              </select>
              <button type="button" style={s.btnGhost} onClick={addExerciseToPlan}>
                + Dodaj ćwiczenie
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button type="submit" style={s.btn} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz plan'}
              </button>
              <button type="button" style={s.btnGhost} onClick={() => setShowForm(false)}>
                Anuluj
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button style={s.btn} onClick={openCreate}>+ Nowy plan</button>
      )}

      {!showForm && plans.length === 0 && (
        <div style={s.empty}>Brak planów. Stwórz swój pierwszy plan treningowy!</div>
      )}

      {!showForm && plans.map(plan => (
        <div key={plan.id} style={s.card}>
          <div style={s.planHeader}>
            <div style={s.planName}>{plan.name}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={s.btnGhost} onClick={() => navigate(`/plans/${plan.id}/execute`)}>
                ▶ Zacznij trening
              </button>
              <button style={s.btnGhost} onClick={() => openEdit(plan)}>Edytuj</button>
              <button style={{ ...s.btnGhost, color: '#e74c3c', borderColor: '#c0392b' }} onClick={() => handleDelete(plan.id)}>
                Usuń
              </button>
            </div>
          </div>
          {plan.description && <div style={s.meta}>{plan.description}</div>}
          {plan.exercises.length === 0 ? (
            <div style={s.meta}>Brak ćwiczeń</div>
          ) : (
            plan.exercises.map(pe => (
              <div key={pe.id} style={s.planExRow}>
                <span style={s.planExName}>{pe.exercise_name}</span>
                <span style={s.planExSets}>
                  {pe.sets.length} {pluralSety(pe.sets.length)}
                  {pe.sets[0]?.planned_weight_kg != null && ` · ${pe.sets[0].planned_weight_kg}kg`}
                  {pe.sets[0]?.planned_reps != null && ` × ${pe.sets[0].planned_reps}`}
                </span>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { background: '#1a1a1a', minHeight: '100vh', padding: '24px', color: '#f0f0f0', fontFamily: 'sans-serif' },
  card: { background: '#2a2a2a', borderRadius: '10px', padding: '24px', marginBottom: '16px' },
  title: { fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--accent)' },
  sectionLabel: { fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginTop: '20px', marginBottom: '10px' },
  field: { display: 'flex', flexDirection: 'column' as const, marginBottom: '12px' },
  label: { fontSize: '13px', color: '#aaa', marginBottom: '4px' },
  input: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444', borderRadius: '6px', padding: '8px 10px', fontSize: '14px' },
  textarea: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444', borderRadius: '6px', padding: '8px 10px', fontSize: '14px', resize: 'vertical' as const, minHeight: '60px' },
  select: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', flex: 1 },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '14px', cursor: 'pointer', marginBottom: '16px' },
  btnGhost: { background: '#333', color: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' },
  removeBtn: { background: 'transparent', border: '1px solid #c0392b', color: '#e74c3c', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' },
  exerciseBlock: { background: '#1e1e1e', borderRadius: '8px', padding: '12px', marginBottom: '10px' },
  exerciseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  exerciseName: { color: 'var(--accent)', fontWeight: 600, fontSize: '14px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  setLabel: { color: '#aaa', fontSize: '13px', minWidth: '42px' },
  setInput: { background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', width: '72px' },
  setUnit: { color: '#666', fontSize: '12px' },
  addExRow: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' as const },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' as const, gap: '8px' },
  planName: { fontWeight: 700, fontSize: '16px' },
  meta: { fontSize: '13px', color: '#aaa', marginBottom: '8px' },
  planExRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #333' },
  planExName: { fontSize: '14px', color: '#ddd' },
  planExSets: { fontSize: '13px', color: '#888' },
  empty: { color: '#777', fontSize: '14px', padding: '16px 0' },
  error: { color: '#e74c3c', fontSize: '13px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(231,76,60,0.1)', borderRadius: '6px' },
}
