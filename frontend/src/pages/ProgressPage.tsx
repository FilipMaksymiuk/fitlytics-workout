import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getRecords, getProgress, getWeeklyVolume, getMonthlyDays } from '../api/progress'
import { getExercises } from '../api/exercises'

interface Record {
  exercise_name: string
  record_kg: number
  achieved_at: string
}

interface Exercise {
  id: number
  name: string
}

interface ProgressPoint {
  session_date: string
  max_weight: number
}

interface WeeklyVolume {
  week_start: string
  total_volume: number
}

interface MonthlyDays {
  training_days: number
  dates: string[]
}

const MONTH_NAMES = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
]

const styles: Record<string, React.CSSProperties> = {
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
    marginBottom: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#e63946',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    borderBottom: '1px solid #444',
    color: '#aaa',
    fontSize: '13px',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #333',
    fontSize: '14px',
  },
  select: {
    background: '#1a1a1a',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '14px',
    marginRight: '12px',
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
  tag: {
    display: 'inline-block',
    background: '#1a1a1a',
    border: '1px solid #e63946',
    color: '#e63946',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '13px',
    margin: '4px',
  },
  summary: {
    marginBottom: '12px',
    fontSize: '15px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
}

function Spinner() {
  return <div style={styles.spinner}>Ładowanie...</div>
}

function Empty() {
  return <div style={styles.empty}>Brak danych do wyświetlenia</div>
}

function RecordsSection() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecords()
      .then(res => {
        const sorted = [...(res.data as Record[])].sort((a, b) => b.record_kg - a.record_kg)
        setRecords(sorted)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={styles.card}>
      <div style={styles.title}>Rekordy życiowe</div>
      {loading ? <Spinner /> : records.length === 0 ? <Empty /> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ćwiczenie</th>
              <th style={styles.th}>Rekord (kg)</th>
              <th style={styles.th}>Data osiągnięcia</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td style={styles.td}>{r.exercise_name}</td>
                <td style={styles.td}>{r.record_kg}</td>
                <td style={styles.td}>{r.achieved_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ProgressSection() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
  const [days, setDays] = useState(30)
  const [data, setData] = useState<ProgressPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getExercises().then(res => {
      const list = res.data as Exercise[]
      setExercises(list)
      if (list.length > 0) setSelectedExercise(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedExercise === null) return
    setLoading(true)
    getProgress(selectedExercise, days)
      .then(res => setData(res.data as ProgressPoint[]))
      .finally(() => setLoading(false))
  }, [selectedExercise, days])

  return (
    <div style={styles.card}>
      <div style={styles.title}>Progresja ciężaru</div>
      <div style={styles.controls}>
        <select
          style={styles.select}
          value={selectedExercise ?? ''}
          onChange={e => setSelectedExercise(Number(e.target.value))}
        >
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={days}
          onChange={e => setDays(Number(e.target.value))}
        >
          <option value={7}>7 dni</option>
          <option value={30}>30 dni</option>
          <option value={60}>60 dni</option>
          <option value={90}>90 dni</option>
        </select>
      </div>
      {loading ? <Spinner /> : data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="session_date" tick={{ fill: '#aaa', fontSize: 12 }} />
            <YAxis tick={{ fill: '#aaa', fontSize: 12 }} unit=" kg" />
            <Tooltip
              contentStyle={{ background: '#2a2a2a', border: '1px solid #444', color: '#f0f0f0' }}
              formatter={(val: number) => [`${val} kg`, 'Ciężar']}
            />
            <Line type="monotone" dataKey="max_weight" stroke="#e63946" dot={{ r: 5, fill: '#e63946' }} activeDot={{ r: 7 }} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function WeeklyVolumeSection() {
  const [data, setData] = useState<WeeklyVolume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeklyVolume(12)
      .then(res => setData(res.data as WeeklyVolume[]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={styles.card}>
      <div style={styles.title}>Objętość tygodniowa</div>
      {loading ? <Spinner /> : data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="week_start" tick={{ fill: '#aaa', fontSize: 12 }} />
            <YAxis tick={{ fill: '#aaa', fontSize: 12 }} unit=" kg" />
            <Tooltip
              contentStyle={{ background: '#2a2a2a', border: '1px solid #444', color: '#f0f0f0' }}
              formatter={(val: number) => [`${val} kg`, 'Objętość']}
            />
            <Bar dataKey="total_volume" fill="#e63946" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function MonthlyDaysSection() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlyDays | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMonthlyDays(year, month)
      .then(res => setData(res.data as MonthlyDays))
      .finally(() => setLoading(false))
  }, [year, month])

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div style={styles.card}>
      <div style={styles.title}>Dni treningowe w miesiącu</div>
      <div style={styles.controls}>
        <select
          style={styles.select}
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {loading ? <Spinner /> : !data ? <Empty /> : (
        <>
          <div style={styles.summary}>
            W {MONTH_NAMES[month - 1]} {year} trenowałeś <strong>{data.training_days}</strong> dni
          </div>
          <div>
            {data.dates.length === 0
              ? <Empty />
              : data.dates.map((d, i) => <span key={i} style={styles.tag}>{d}</span>)
            }
          </div>
        </>
      )}
    </div>
  )
}

export default function ProgressPage() {
  return (
    <div style={styles.page}>
      <RecordsSection />
      <ProgressSection />
      <WeeklyVolumeSection />
      <MonthlyDaysSection />
    </div>
  )
}
