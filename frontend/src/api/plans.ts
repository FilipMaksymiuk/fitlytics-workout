import client from './client'

export interface PlanSetPayload {
  set_number: number
  planned_weight_kg: number | null
  planned_reps: number | null
}

export interface PlanExercisePayload {
  exercise_id: number
  order_index: number
  sets: PlanSetPayload[]
}

export const getPlans = () =>
  client.get('/plans')

export const getPlan = (id: number) =>
  client.get(`/plans/${id}`)

export const createPlan = (data: { name: string; description?: string; exercises: PlanExercisePayload[] }) =>
  client.post('/plans', data)

export const updatePlan = (id: number, data: { name?: string; description?: string; exercises?: PlanExercisePayload[] }) =>
  client.patch(`/plans/${id}`, data)

export const deletePlan = (id: number) =>
  client.delete(`/plans/${id}`)
