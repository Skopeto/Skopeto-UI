import apiClient from './client'
import type { DatabaseRegisterRequest, DatabaseUpdateRequest, Database } from '@/types/api'

export const databasesApi = {
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

  // Get all servers with health + databases with database health
  getAllDatabases: async (): Promise<any> => {
    const { data } = await apiClient.get('/databases/collect/all')
    return data
  },
}
