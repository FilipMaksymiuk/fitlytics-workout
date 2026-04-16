import client from './client'

export const register = (data: object) =>
  client.post('/auth/register', data)

export const login = (data: object) =>
  client.post('/auth/login', data)
