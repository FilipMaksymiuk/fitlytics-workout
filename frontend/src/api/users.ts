import client from './client'

export const getMe = () =>
  client.get('/users/me')

export const updateMe = (data: {
  email?: string
  username?: string
  current_password?: string
  new_password?: string
}) => client.patch('/users/me', data)
