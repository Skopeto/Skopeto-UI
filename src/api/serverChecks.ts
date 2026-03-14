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
    checkId: number,
    checkData: UpdateServerCheckRequest,
  ): Promise<ServerCheck> => {
    const { data } = await apiClient.patch(`/server-checks/${checkId}`, checkData)
    return data.data
  },

  delete: async (checkId: number): Promise<void> => {
    await apiClient.delete(`/server-checks/${checkId}`)
  },
}
