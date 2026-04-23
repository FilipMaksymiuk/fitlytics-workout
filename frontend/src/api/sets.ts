import client from './client'

export const createSet = (data: object) =>
  client.post('/sets', data)

export const getSetsBySession = (session_id: number) =>
  client.get(`/sets/session/${session_id}`)

export const deleteSet = (set_id: number) =>
  client.delete(`/sets/${set_id}`)

export const updateSet = (set_id: number, data: { weight_kg?: number | null; reps?: number | null }) =>
  client.patch(`/sets/${set_id}`, data)
