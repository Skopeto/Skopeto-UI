import apiClient from './client'
import type { ServerRegisterRequest, ServerUpdateRequest, Server } from '@/types/api'

export const serversApi = {
  register: async (serverData: ServerRegisterRequest): Promise<Server> => {
    const { data } = await apiClient.post('/servers/register', serverData)
    return data.data
  },

  deleteServer: async (serverId: number): Promise<void> => {
    await apiClient.delete(`/servers/delete/${serverId}`)
  },

  updateServer: async (serverId: number, serverData: ServerUpdateRequest): Promise<Server> => {
    const { data } = await apiClient.patch(`/servers/edit/${serverId}`, serverData)
    return data.data
  },

  // Data fetching methods

  // Get all servers (no health/containers/databases)
  getServers: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/all-servers')
    return data
  },

  // Get all servers with health + containers
  getAllServersWithContainers: async (): Promise<any> => {
    const { data } = await apiClient.get('/containers/all')
    return data
  },

  // Get single server with containers
  getServerWithContainers: async (serverId: number): Promise<any> => {
    const { data } = await apiClient.post(`/containers/collect/${serverId}`)
    return data
  },

  // Collect all (servers + health + containers + databases)
  collectAll: async (): Promise<any> => {
    const { data } = await apiClient.post('/monitoring/collect-all')
    return data
  },
}
