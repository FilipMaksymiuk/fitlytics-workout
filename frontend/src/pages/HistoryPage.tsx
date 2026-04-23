import { useState, useEffect } from 'react'
import { getSessions, getSession, updateSession, deleteSession } from '../api/sessions'
import { updateSet } from '../api/sets'

interface SetItem {
  id: number
  exercise_id: number
  set_number: number
  weight_kg: number | null
  reps: number | null
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

interface EditSet {
  weight_kg: string
  reps: string
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, SessionDetail | null>>({})
  const [loadingDetail, setLoadingDetail] = useState<Record<number, boolean>>({})
  const [detailError, setDetailError] = useState<Record<number, string>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editSets, setEditSets] = useState<Record<number, EditSet>>({})
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchSessions = () => {
    setLoading(true)
    getSessions()
      .then(res => setSessions(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleToggle = async (id: number) => {
    if (expanded[id] !== undefined) {
      setExpanded(prev => { const next = { ...prev }; delete next[id]; return next })
      return
    }
    setLoadingDetail(prev => ({ ...prev, [id]: true }))
    setDetailError(prev => ({ ...prev, [id]: '' }))
    try {
      const res = await getSession(id)
      setExpanded(prev => ({ ...prev, [id]: res.data }))
    } catch {
      setDetailError(prev => ({ ...prev, [id]: 'Nie udało się załadować szczegółów' }))
    } finally {
      setLoadingDetail(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleEditStart = async (session: Session) => {
    setActionError('')
    setEditNotes(session.notes ?? '')
    setEditDuration(session.duration_minutes != null ? String(session.duration_minutes) : '')

    let detail = expanded[session.id]
    if (!detail) {
      setLoadingDetail(prev => ({ ...prev, [session.id]: true }))
      try {
        const res = await getSession(session.id)
        detail = res.data
        setExpanded(prev => ({ ...prev, [session.id]: res.data }))
      } catch {
        setActionError('Nie udało się załadować setów do edycji')
        setLoadingDetail(prev => ({ ...prev, [session.id]: false }))
        return
      } finally {
        setLoadingDetail(prev => ({ ...prev, [session.id]: false }))
      }
    }

    const initial: Record<number, EditSet> = {}
    for (const s of detail!.workout_sets) {
      initial[s.id] = {
        weight_kg: s.weight_kg != null ? String(s.weight_kg) : '',
        reps: s.reps != null ? String(s.reps) : '',
      }
    }
    setEditSets(initial)
    setEditingId(session.id)
  }

  const handleSetFieldChange = (setId: number, field: keyof EditSet, value: string) => {
    setEditSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: value } }))
  }

  const handleEditSave = async (sessionId: number) => {
    setSaving(true)
    setActionError('')
    try {
      const sessionData: { notes?: string; duration_minutes?: number } = { notes: editNotes }
      if (editDuration !== '') sessionData.duration_minutes = Number(editDuration)
      const sessionRes = await updateSession(sessionId, sessionData)
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...sessionRes.data } : s))

      const setUpdates = Object.entries(editSets).map(([id, vals]) =>
        updateSet(Number(id), {
          weight_kg: vals.weight_kg !== '' ? parseFloat(vals.weight_kg) : null,
          reps: vals.reps !== '' ? parseInt(vals.reps) : null,
        })
      )
      const results = await Promise.all(setUpdates)

      setExpanded(prev => {
        const detail = prev[sessionId]
        if (!detail) return prev
        const updatedSets = detail.workout_sets.map(s => {
          const res = results.find((r: { data: SetItem }) => r.data.id === s.id)
          return res ? res.data : s
        })
        return { ...prev, [sessionId]: { ...detail, workout_sets: updatedSets } }
      })

      setEditingId(null)
    } catch {
      setActionError('Nie udało się zapisać zmian')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (id: number) => {
    if (!window.confirm('Na pewno usunąć ten trening? Wszystkie sety zostaną usunięte.')) return
    setActionError('')
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      setExpanded(prev => { const next = { ...prev }; delete next[id]; return next })
    } catch {
      setActionError('Nie udało się usunąć treningu')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
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
      {actionError && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{actionError}</p>}
      {sessions.map(session => {
        const detail = expanded[session.id]
        const isExpanded = detail !== undefined
        const isEditing = editingId === session.id
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

            {isEditing ? (
              <div style={styles.editForm}>
                <div style={styles.editRow}>
                  <div style={styles.editField}>
                    <label style={styles.editLabel}>Czas trwania (min)</label>
                    <input
                      style={styles.editInput}
                      type="number"
                      min={0}
                      value={editDuration}
                      onChange={e => setEditDuration(e.target.value)}
                      placeholder="np. 60"
                    />
                  </div>
                </div>
                <div style={styles.editField}>
                  <label style={styles.editLabel}>Notatki</label>
                  <textarea
                    style={styles.editTextarea}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Notatki do treningu..."
                  />
                </div>

                {Object.entries(groupedSets).map(([name, sets]) => (
                  <div key={name} style={styles.editExerciseBlock}>
                    <p style={styles.exerciseName}>{name}</p>
                    {[...sets].sort((a, b) => a.set_number - b.set_number).map(s => (
                      <div key={s.id} style={styles.editSetRow}>
                        <span style={styles.setLabel}>Set {s.set_number}</span>
                        <div style={styles.editSetField}>
                          <label style={styles.editLabel}>kg</label>
                          <input
                            style={styles.editSetInput}
                            type="number"
                            step={0.5}
                            min={0}
                            value={editSets[s.id]?.weight_kg ?? ''}
                            onChange={e => handleSetFieldChange(s.id, 'weight_kg', e.target.value)}
                          />
                        </div>
                        <div style={styles.editSetField}>
                          <label style={styles.editLabel}>powt.</label>
                          <input
                            style={styles.editSetInput}
                            type="number"
                            min={1}
                            value={editSets[s.id]?.reps ?? ''}
                            onChange={e => handleSetFieldChange(s.id, 'reps', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div style={styles.editActions}>
                  <button style={styles.saveBtn} onClick={() => handleEditSave(session.id)} disabled={saving}>
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                  <button style={styles.cancelBtn} onClick={() => setEditingId(null)} disabled={saving}>
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <>
                {session.duration_minutes != null && (
                  <p style={styles.meta}>Czas trwania: {session.duration_minutes} min</p>
                )}
                {session.notes && (
                  <p style={styles.meta}>Notatki: {session.notes}</p>
                )}
              </>
            )}

            {!isEditing && (
              <div style={styles.cardActions}>
                <button style={styles.detailBtn} onClick={() => handleToggle(session.id)}>
                  {loadingDetail[session.id] ? 'Ładowanie...' : isExpanded ? 'Zwiń' : 'Szczegóły'}
                </button>
                <button style={styles.editBtn} onClick={() => handleEditStart(session)}>
                  {loadingDetail[session.id] ? 'Ładowanie...' : 'Edytuj'}
                </button>
                <button style={styles.deleteBtn} onClick={() => handleDeleteSession(session.id)}>Usuń</button>
              </div>
            )}

            {detailError[session.id] && (
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{detailError[session.id]}</p>
            )}

            {!isEditing && isExpanded && detail && (
              <div style={styles.details}>
                {Object.entries(groupedSets).map(([name, sets]) => (
                  <div key={name} style={{ marginBottom: '0.75rem' }}>
                    <p style={styles.exerciseName}>{name}</p>
                    {[...sets].sort((a, b) => a.set_number - b.set_number).map(s => (
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
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  detailBtn: {
    backgroundColor: 'transparent',
    border: '1px solid var(--accent)',
    borderRadius: '6px',
    color: 'var(--accent)',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  editBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #555',
    borderRadius: '6px',
    color: '#ccc',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #c0392b',
    borderRadius: '6px',
    color: '#e74c3c',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  editForm: {
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  editRow: {
    display: 'flex',
    gap: '1rem',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  editLabel: {
    color: '#888',
    fontSize: '0.75rem',
  },
  editInput: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#fff',
    fontSize: '0.9rem',
  },
  editTextarea: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#fff',
    fontSize: '0.9rem',
    resize: 'vertical' as const,
    minHeight: '60px',
  },
  editExerciseBlock: {
    borderTop: '1px solid #3a3a3a',
    paddingTop: '0.6rem',
  },
  editSetRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    padding: '0.35rem 0',
    borderBottom: '1px solid #333',
  },
  setLabel: {
    color: '#aaa',
    fontSize: '0.85rem',
    minWidth: '42px',
    paddingBottom: '0.5rem',
  },
  editSetField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  editSetInput: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '0.4rem 0.6rem',
    color: '#fff',
    fontSize: '0.9rem',
    width: '80px',
  },
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  saveBtn: {
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    padding: '0.4rem 1.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #555',
    borderRadius: '6px',
    color: '#ccc',
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
    color: 'var(--accent)',
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
    borderTop: '4px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
