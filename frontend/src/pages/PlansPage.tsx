import { useState, useEffect } from 'react'
import { getPlans, createPlan, updatePlan, deletePlan } from '../api/plans'

interface Plan {
  id: number
  name: string
  description?: string
  planned_at: string
  deadline: string
  is_completed: boolean
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#1a1a1a',
    minHeight: '100vh',
    padding: '24px',
    color: '#f0f0f0',
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#2a2a2a',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#e63946',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '12px',
  },
  label: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '4px',
  },
  input: {
    background: '#1a1a1a',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '14px',
  },
  textarea: {
    background: '#1a1a1a',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '14px',
    resize: 'vertical' as const,
    minHeight: '70px',
  },
  btn: {
    background: '#e63946',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  btnGhost: {
    background: '#333',
    color: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  badge: (color: string): React.CSSProperties => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 600,
    marginLeft: '8px',
  }),
  planName: {
    fontWeight: 700,
    fontSize: '16px',
    marginBottom: '6px',
  },
  meta: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '4px',
  },
  actions: {
    marginTop: '12px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  spinner: {
    color: '#aaa',
    fontSize: '14px',
    padding: '16px 0',
  },
  empty: {
    color: '#777',
    fontSize: '14px',
    padding: '16px 0',
  },
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [plannedAt, setPlannedAt] = useState('')
  const [deadline, setDeadline] = useState('')

  const fetchPlans = (includeCompleted: boolean) => {
    setLoading(true)
    getPlans(includeCompleted)
      .then(res => setPlans(res.data as Plan[]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPlans(showCompleted)
  }, [showCompleted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !plannedAt || !deadline) return
    createPlan({ name, description, planned_at: plannedAt, deadline }).then(() => {
      setName('')
      setDescription('')
      setPlannedAt('')
      setDeadline('')
      fetchPlans(showCompleted)
    })
  }

  const handleComplete = (id: number) => {
    updatePlan(id, { is_completed: true }).then(() => fetchPlans(showCompleted))
  }

  const handleDelete = (id: number) => {
    deletePlan(id).then(() => fetchPlans(showCompleted))
  }

  const isOverdue = (plan: Plan) =>
    !plan.is_completed && new Date(plan.deadline) < new Date()

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Nowy plan treningowy</div>
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Nazwa planu</label>
            <input
              style={s.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Opis (opcjonalne)</label>
            <textarea
              style={s.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Data planowanego treningu</label>
            <input
              style={s.input}
              type="datetime-local"
              value={plannedAt}
              onChange={e => setPlannedAt(e.target.value)}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Deadline</label>
            <input
              style={s.input}
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
          </div>
          <button style={s.btn} type="submit">Dodaj plan</button>
        </form>
      </div>

      <label style={s.checkboxRow}>
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={e => setShowCompleted(e.target.checked)}
        />
        Pokaż ukończone
      </label>

      {loading ? (
        <div style={s.spinner}>Ładowanie...</div>
      ) : plans.length === 0 ? (
        <div style={s.empty}>Brak planów treningowych. Dodaj swój pierwszy plan!</div>
      ) : (
        plans.map(plan => (
          <div key={plan.id} style={s.card}>
            <div style={s.planName}>
              {plan.name}
              {plan.is_completed && <span style={s.badge('#2ecc71')}>Ukończony</span>}
              {isOverdue(plan) && <span style={s.badge('#e63946')}>Spóźniony</span>}
            </div>
            {plan.description && <div style={s.meta}>{plan.description}</div>}
            <div style={s.meta}>Trening: {new Date(plan.planned_at).toLocaleString('pl-PL')}</div>
            <div style={s.meta}>Deadline: {new Date(plan.deadline).toLocaleString('pl-PL')}</div>
            <div style={s.actions}>
              {!plan.is_completed && (
                <button style={s.btnGhost} onClick={() => handleComplete(plan.id)}>
                  Oznacz jako ukończony
                </button>
              )}
              <button style={s.btnGhost} onClick={() => handleDelete(plan.id)}>
                Usuń
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
