import { NavLink, useNavigate } from 'react-router-dom'

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
    color: '#e63946',
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
    border: '1px solid #e63946',
    color: '#e63946',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
}

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? '#e63946' : '#ccc',
  textDecoration: isActive ? 'underline' : 'none',
  fontSize: '14px',
})

export default function Navbar() {
  const navigate = useNavigate()

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
        <button style={styles.logout} onClick={handleLogout}>Wyloguj</button>
      </div>
    </nav>
  )
}
