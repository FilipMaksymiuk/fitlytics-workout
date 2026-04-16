import client from './client'

export const createSet = (data: object) =>
  client.post('/sets', data)

export const getSetsBySession = (session_id: number) =>
  client.get(`/sets/session/${session_id}`)

export const deleteSet = (set_id: number) =>
  client.delete(`/sets/${set_id}`)
