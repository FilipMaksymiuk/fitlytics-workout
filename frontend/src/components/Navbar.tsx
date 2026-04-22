import { NavLink, useNavigate } from 'react-router-dom'
import { useAccent, ACCENT_COLORS } from '../AccentContext'

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#2a2a2a',
    padding: '0 24px',
    height: '56px',
    borderBottom: '1px solid #333',
  },
  logo: {
    color: 'var(--accent)',
    fontWeight: 700,
    fontSize: '18px',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  logout: {
    background: 'transparent',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  picker: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginRight: '16px',
  },
}

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? 'var(--accent)' : '#ccc',
  textDecoration: isActive ? 'underline' : 'none',
  fontSize: '14px',
})

export default function Navbar() {
  const navigate = useNavigate()
  const { accent, setAccent } = useAccent()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <NavLink to="/" style={styles.logo}>Fitlytics Workout</NavLink>
      <div style={styles.links}>
        <NavLink to="/" end style={linkStyle}>Trening</NavLink>
        <NavLink to="/history" style={linkStyle}>Historia</NavLink>
        <NavLink to="/progress" style={linkStyle}>Postępy</NavLink>
        <NavLink to="/plans" style={linkStyle}>Plany</NavLink>
        <div style={styles.picker}>
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => setAccent(c.value)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: c.value,
                border: accent === c.value ? '2px solid #fff' : '2px solid transparent',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: accent === c.value ? `0 0 0 1px ${c.value}` : 'none',
                transition: 'border 0.15s, box-shadow 0.15s',
              }}
            />
          ))}
        </div>
        <button style={styles.logout} onClick={handleLogout}>Wyloguj</button>
      </div>
    </nav>
  )
}
