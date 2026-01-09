import apiClient from './client'
import type { User } from '@/types/api'

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users')
    return data.data
  },

  getById: async (userId: number): Promise<User> => {
    const { data } = await apiClient.get(`/users/${userId}`)
    return data.data
  },
}
