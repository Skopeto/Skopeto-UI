import apiClient from './client'
import type {
  DatabaseRegisterRequest,
  DatabaseUpdateRequest,
  Database,
  ServerDatabasesData,
} from '@/types/api'

export const databasesApi = {
  register: async (databaseData: DatabaseRegisterRequest): Promise<Database> => {
    const { data } = await apiClient.post('/databases', databaseData)
    return data.data
  },

  deleteDatabase: async (databaseId: number): Promise<void> => {
    await apiClient.delete(`/databases/${databaseId}`)
  },

  updateDatabase: async (
    databaseId: number,
    databaseData: DatabaseUpdateRequest,
  ): Promise<Database> => {
    const { data } = await apiClient.patch(`/databases/${databaseId}`, databaseData)
    return data.data
  },

  // Get all servers with health + databases with database health
  getAllDatabases: async (): Promise<{ data: ServerDatabasesData[] }> => {
    const { data } = await apiClient.get('/databases/health')
    return data
  },

  // Get single server with health + databases with database health
  getServerDatabases: async (serverId: number): Promise<{ data: ServerDatabasesData }> => {
    const { data } = await apiClient.get(`/databases/health/${serverId}`)
    return data
  },
}
