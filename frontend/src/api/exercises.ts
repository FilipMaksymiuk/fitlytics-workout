import client from './client'

export const getExercises = (muscle_group?: string) =>
  client.get('/exercises', { params: muscle_group ? { muscle_group } : {} })

export const getExercise = (id: number) =>
  client.get(`/exercises/${id}`)

export const createExercise = (data: object) =>
  client.post('/exercises', data)

export const deleteExercise = (id: number) =>
  client.delete(`/exercises/${id}`)
