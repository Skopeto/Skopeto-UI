import apiClient from './client'

export interface SchedulerTimer {
  interval_minutes: number
  message?: string
}

export interface UpdateTimerRequest {
  interval_minutes: number
}

export const schedulerApi = {
  getTimer: async (): Promise<SchedulerTimer> => {
    const { data } = await apiClient.get('/scheduler/timer')
    return data
  },

  updateTimer: async (request: UpdateTimerRequest): Promise<SchedulerTimer> => {
    const { data } = await apiClient.put('/scheduler/timer', request)
    return data
  },
}
