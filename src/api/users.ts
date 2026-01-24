import apiClient from './client'
import type { User, UpdateUserRequest } from '@/types/api'

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users')
    return data.data
  },

  getById: async (userId: number): Promise<User> => {
    const { data } = await apiClient.get(`/users/${userId}`)
    return data.data
  },

  manage: async (userId: number, updateData: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.patch(`/users/manage/${userId}`, updateData)
    return data.data
  },

  update: async (userId: number, updateData: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${userId}`, updateData)
    return data.data
  },
}
