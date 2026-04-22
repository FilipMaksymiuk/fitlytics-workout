import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getRecords, getProgress, getWeeklyVolume, getMonthlyDays } from '../api/progress'
import { getExercises } from '../api/exercises'

interface Record {
  exercise_name: string
  max_weight: number
  date_achieved: string
}

interface Exercise {
  id: number
  name: string
}

interface ProgressPoint {
  date: string
  max_weight: number
}

interface WeeklyVolume {
  week_start_date: string
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
    color: 'var(--accent)',
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
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
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
        const sorted = [...(res.data as Record[])].sort((a, b) => b.max_weight - a.max_weight)
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
                <td style={styles.td}>{r.max_weight} kg</td>
                <td style={styles.td}>{new Date(r.date_achieved).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
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
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#777', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#333' }}
              tickFormatter={(val: string) => {
                const d = new Date(val)
                return `${d.getDate()} ${['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'][d.getMonth()]}`
              }}
            />
            <YAxis
              tick={{ fill: '#777', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit=" kg"
              domain={['auto', 'auto']}
              width={55}
            />
            <Tooltip
              contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#f0f0f0', padding: '10px 14px' }}
              labelStyle={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}
              itemStyle={{ color: 'var(--accent)', fontWeight: 700, fontSize: '15px' }}
              labelFormatter={(val: string) => new Date(val).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              formatter={(val: number) => [`${val} kg`, '']}
              cursor={{ stroke: '#444', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="max_weight"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--accent)', stroke: '#1a1a1a', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: 'var(--accent)', stroke: '#fff', strokeWidth: 2 }}
            />
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
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" vertical={false} />
            <XAxis
              dataKey="week_start_date"
              tick={{ fill: '#777', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#333' }}
              tickFormatter={(val: string) => {
                const d = new Date(val)
                return `${d.getDate()} ${['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'][d.getMonth()]}`
              }}
            />
            <YAxis
              tick={{ fill: '#777', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit=" kg"
              width={60}
            />
            <Tooltip
              contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#f0f0f0', padding: '10px 14px' }}
              labelStyle={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}
              itemStyle={{ color: 'var(--accent)', fontWeight: 700, fontSize: '15px' }}
              labelFormatter={(val: string) => {
                const d = new Date(val)
                return `Tydzień od ${d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`
              }}
              formatter={(val: number) => [`${Math.round(val as number)} kg`, '']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="total_volume" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']

function buildCalendar(year: number, month: number, dates: string[]) {
  const trainingMap = new Map<number, string>()
  for (const d of dates) {
    const date = new Date(d)
    const day = date.getDate()
    const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    if (!trainingMap.has(day)) trainingMap.set(day, time)
  }
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return { cells, trainingMap, daysInMonth }
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
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={styles.title}>Dni treningowe w miesiącu</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select style={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select style={styles.select} value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {loading ? <Spinner /> : !data ? <Empty /> : (() => {
        const { cells, trainingMap, daysInMonth } = buildCalendar(year, month, data.dates)
        return (
          <>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#aaa' }}>
              Treningi:{' '}
              <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>{data.training_days}</strong>
              <span style={{ color: '#555' }}> / {daysInMonth} dni</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: 'center', color: '#555', fontSize: '11px', paddingBottom: '6px', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />
                const time = trainingMap.get(day)
                const isTraining = !!time
                const isToday = isCurrentMonth && now.getDate() === day
                return (
                  <div key={i} title={isTraining ? `Start: ${time}` : undefined} style={{
                    background: isTraining ? 'var(--accent)' : '#1e1e1e',
                    border: isToday && !isTraining ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: '8px',
                    padding: '10px 4px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: isTraining ? '#fff' : isToday ? 'var(--accent)' : '#555',
                    fontWeight: isTraining || isToday ? 700 : 400,
                    cursor: isTraining ? 'default' : undefined,
                  }}>
                    {day}
                  </div>
                )
              })}
            </div>
          </>
        )
      })()}
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
