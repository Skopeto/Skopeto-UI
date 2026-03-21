import apiClient from './client'
import type {
  ServerCheck,
  RegisterServerCheckRequest,
  UpdateServerCheckRequest,
} from '@/types/api'

export const serverChecksApi = {
  getAll: async (): Promise<ServerCheck[]> => {
    const { data } = await apiClient.get('/server-checks')
    return data.data
  },

  register: async (checkData: RegisterServerCheckRequest): Promise<ServerCheck> => {
    const { data } = await apiClient.post('/server-checks', checkData)
    return data.data
  },

  update: async (
    healthCheckId: number,
    checkData: UpdateServerCheckRequest,
  ): Promise<ServerCheck> => {
    if (!healthCheckId) {
      throw new Error('Health check ID is required for update')
    }
    const { data } = await apiClient.put(`/server-checks/${healthCheckId}`, checkData)
    return data.data
  },

  delete: async (healthCheckId: number): Promise<void> => {
    if (!healthCheckId) {
      throw new Error('Health check ID is required for delete')
    }
    await apiClient.delete(`/server-checks/${healthCheckId}`)
  },
}
