import apiClient from './client'
import type { ServerRegisterRequest, ServerUpdateRequest, Server, DatabaseRegisterRequest, DatabaseUpdateRequest, Database } from '@/types/api'

export const serversApi = {
  register: async (serverData: ServerRegisterRequest): Promise<Server> => {
    const { data } = await apiClient.post('/servers/register', serverData)
    return data.data
  },

  getServerWithContainers: async (serverId: number): Promise<any> => {
    const { data } = await apiClient.post(`/containers/collect/${serverId}`)
    return data
  },

  getServers: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/all-servers')
    return data
  },

  collectAll: async (): Promise<any> => {
    const { data } = await apiClient.post('/monitoring/collect-all')
    return data
  },

  getAllServersWithContainers: async (): Promise<any> => {
    const { data } = await apiClient.get('/containers/all')
    return data
  },

  getAllDatabases: async (): Promise<any> => {
    const { data } = await apiClient.get('/databases/collect/all')
    return data
  },

  deleteServer: async (serverId: number): Promise<void> => {
    await apiClient.delete(`/servers/delete/${serverId}`)
  },

  updateServer: async (serverId: number, serverData: ServerUpdateRequest): Promise<Server> => {
    const { data } = await apiClient.patch(`/servers/edit/${serverId}`, serverData)
    return data.data
  },

  // Database API methods
  registerDatabase: async (databaseData: DatabaseRegisterRequest): Promise<Database> => {
    const { data } = await apiClient.post('/databases/register', databaseData)
    return data.data
  },

  deleteDatabase: async (databaseId: number): Promise<void> => {
    await apiClient.delete(`/databases/delete/${databaseId}`)
  },

  updateDatabase: async (databaseId: number, databaseData: DatabaseUpdateRequest): Promise<Database> => {
    const { data } = await apiClient.patch(`/databases/edit/${databaseId}`, databaseData)
    return data.data
  },
}
