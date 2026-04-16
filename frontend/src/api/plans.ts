import client from './client'

export const getPlans = (include_completed: boolean) =>
  client.get('/plans', { params: { include_completed } })

export const createPlan = (data: object) =>
  client.post('/plans', data)

export const updatePlan = (id: number, data: object) =>
  client.patch(`/plans/${id}`, data)

export const deletePlan = (id: number) =>
  client.delete(`/plans/${id}`)
