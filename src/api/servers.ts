import apiClient from './client'
import type {
  ServerRegisterRequest,
  ServerUpdateRequest,
  Server,
  MonitoringData,
} from '@/types/api'

export const serversApi = {
  register: async (serverData: ServerRegisterRequest): Promise<Server> => {
    const { data } = await apiClient.post('/servers', serverData)
    return data.data
  },

  deleteServer: async (serverId: number): Promise<void> => {
    await apiClient.delete(`/servers/${serverId}`)
  },

  updateServer: async (serverId: number, serverData: ServerUpdateRequest): Promise<Server> => {
    const { data } = await apiClient.patch(`/servers/${serverId}`, serverData)
    return data.data
  },

  // Get single server with containers and health
  getServerWithContainers: async (serverId: number): Promise<{ data: MonitoringData }> => {
    const { data } = await apiClient.post(`/containers/${serverId}/collect`)
    return data
  },

  // Collect all monitoring data (servers + health + containers + databases)
  collectAll: async (): Promise<{ data: MonitoringData[] }> => {
    const { data } = await apiClient.post('/monitoring/collect')
    return data
  },
}
