import client from './client'

export const getProgress = (exercise_id: number, days: number) =>
  client.get(`/progress/${exercise_id}`, { params: { days } })

export const getRecords = () =>
  client.get('/progress/records')

export const getWeeklyVolume = (weeks: number) =>
  client.get('/progress/weekly-volume', { params: { weeks } })

export const getMonthlyDays = (year: number, month: number) =>
  client.get('/progress/monthly-days', { params: { year, month } })
