import client from './client'

export const createSession = (data: object) =>
  client.post('/sessions', data)

export const endSession = (id: number, data: object) =>
  client.patch(`/sessions/${id}/end`, data)

export const getSessions = () =>
  client.get('/sessions')

export const getSession = (id: number) =>
  client.get(`/sessions/${id}`)

export const updateSession = (id: number, data: { notes?: string; duration_minutes?: number }) =>
  client.patch(`/sessions/${id}`, data)

export const deleteSession = (id: number) =>
  client.delete(`/sessions/${id}`)
