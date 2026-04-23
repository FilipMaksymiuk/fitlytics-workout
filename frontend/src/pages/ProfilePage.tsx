import { useState, useEffect } from 'react'
import { getMe, updateMe } from '../api/users'

interface User {
  id: number
  email: string
  username: string
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getMe()
      .then(res => {
        setUser(res.data)
        setEmail(res.data.email)
        setUsername(res.data.username)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('Nowe hasła się nie zgadzają')
      return
    }
    if (newPassword && !currentPassword) {
      setError('Podaj aktualne hasło aby zmienić hasło')
      return
    }

    setSaving(true)
    try {
      const payload: {
        email?: string
        username?: string
        current_password?: string
        new_password?: string
      } = {}

      if (email !== user?.email) payload.email = email
      if (username !== user?.username) payload.username = username
      if (newPassword) {
        payload.current_password = currentPassword
        payload.new_password = newPassword
      }

      if (Object.keys(payload).length === 0) {
        setError('Nie wprowadzono żadnych zmian')
        return
      }

      const res = await updateMe(payload)
      setUser(res.data)
      setEmail(res.data.email)
      setUsername(res.data.username)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Zmiany zostały zapisane')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Nie udało się zapisać zmian')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Profil</div>

        <div style={s.infoRow}>
          <span style={s.infoLabel}>Konto utworzone</span>
          <span style={s.infoValue}>
            {user ? new Date(user.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div style={s.section}>Dane konta</div>

          <div style={s.field}>
            <label style={s.label}>Nazwa użytkownika</label>
            <input
              style={s.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={s.section}>Zmiana hasła</div>

          <div style={s.field}>
            <label style={s.label}>Aktualne hasło</label>
            <input
              style={s.input}
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Wymagane tylko przy zmianie hasła"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Nowe hasło</label>
            <input
              style={s.input}
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Pozostaw puste jeśli nie zmieniasz"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Potwierdź nowe hasło</label>
            <input
              style={s.input}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Powtórz nowe hasło"
            />
          </div>

          {error && <div style={s.error}>{error}</div>}
          {success && <div style={s.successMsg}>{success}</div>}

          <button style={s.btn} type="submit" disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#1a1a1a',
    minHeight: '100vh',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  card: {
    background: '#2a2a2a',
    borderRadius: '10px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--accent)',
    marginBottom: '24px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
  },
  infoLabel: {
    color: '#888',
    fontSize: '13px',
  },
  infoValue: {
    color: '#ccc',
    fontSize: '13px',
  },
  section: {
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    marginTop: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '14px',
  },
  label: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '5px',
  },
  input: {
    background: '#1a1a1a',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '9px 12px',
    fontSize: '14px',
  },
  error: {
    color: '#e74c3c',
    fontSize: '13px',
    marginBottom: '12px',
    padding: '8px 12px',
    background: 'rgba(231,76,60,0.1)',
    borderRadius: '6px',
  },
  successMsg: {
    color: '#2ecc71',
    fontSize: '13px',
    marginBottom: '12px',
    padding: '8px 12px',
    background: 'rgba(46,204,113,0.1)',
    borderRadius: '6px',
  },
  btn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
    width: '100%',
  },
}
