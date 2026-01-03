import apiClient from './client'
import type { DatabaseRegisterRequest, DatabaseUpdateRequest, Database } from '@/types/api'

export const databasesApi = {
  getAllDatabases: async (): Promise<any> => {
    const { data } = await apiClient.get('/databases/collect/all')
    return data
  },

  register: async (databaseData: DatabaseRegisterRequest): Promise<Database> => {
    const { data } = await apiClient.post('/databases/register', databaseData)
    return data.data
  },

  deleteDatabase: async (databaseId: number): Promise<void> => {
    await apiClient.delete(`/databases/delete/${databaseId}`)
  },

  updateDatabase: async (
    databaseId: number,
    databaseData: DatabaseUpdateRequest,
  ): Promise<Database> => {
    const { data } = await apiClient.patch(`/databases/update/${databaseId}`, databaseData)
    return data.data
  },
}
