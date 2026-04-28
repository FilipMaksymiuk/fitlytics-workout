import { useState } from 'react'
import { createExercise } from '../api/exercises'

interface Props {
  onAdded: (exercise: { id: number; name: string; is_custom: boolean }) => void
  onCancel: () => void
}

const CATEGORIES = ['Siłowe', 'Cardio', 'Mobilność', 'Inne']
const EQUIPMENT = ['', 'Sztanga', 'Hantle', 'Maszyna', 'Własne ciało', 'Gumy', 'Kettlebell']

export default function AddCustomExerciseForm({ onAdded, onCancel }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Siłowe')
  const [equipment, setEquipment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await createExercise({
        name: name.trim(),
        category,
        equipment: equipment || null,
        description: null,
        muscle_groups: [],
      })
      onAdded(res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Nie udało się dodać ćwiczenia')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.box}>
      <div style={s.title}>Nowe własne ćwiczenie</div>
      <form onSubmit={handleSubmit}>
        <div style={s.field}>
          <label style={s.label}>Nazwa *</label>
          <input
            style={s.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="np. Podciągania, Face Pull..."
            autoFocus
            required
          />
        </div>
        <div style={s.row}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Kategoria</label>
            <select style={s.input} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Sprzęt</label>
            <select style={s.input} value={equipment} onChange={e => setEquipment(e.target.value)}>
              <option value="">Brak / nie dotyczy</option>
              {EQUIPMENT.filter(Boolean).map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.actions}>
          <button type="submit" style={s.btnPrimary} disabled={saving || !name.trim()}>
            {saving ? 'Dodawanie...' : 'Dodaj ćwiczenie'}
          </button>
          <button type="button" style={s.btnGhost} onClick={onCancel}>
            Anuluj
          </button>
        </div>
      </form>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  box: {
    background: '#1e1e1e',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '8px',
  },
  title: {
    color: 'var(--accent)',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  row: {
    display: 'flex',
    gap: '8px',
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
    marginBottom: '4px',
  },
  input: {
    background: '#2a2a2a',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '7px 9px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  error: {
    color: '#e74c3c',
    fontSize: '12px',
    marginBottom: '8px',
    padding: '6px 10px',
    background: 'rgba(231,76,60,0.1)',
    borderRadius: '5px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  btnPrimary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnGhost: {
    background: '#333',
    color: '#ccc',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
}
