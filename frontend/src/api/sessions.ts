import client from './client'

export const createSession = (data: object) =>
  client.post('/sessions', data)

export const endSession = (id: number, data: object) =>
  client.patch(`/sessions/${id}/end`, data)

export const getSessions = () =>
  client.get('/sessions')

export const getSession = (id: number) =>
  client.get(`/sessions/${id}`)
