import apiClient from './client'
import type { ServerRegisterRequest, ServerUpdateRequest, Server } from '@/types/api'

export const serversApi = {
  register: async (serverData: ServerRegisterRequest): Promise<Server> => {
    const { data } = await apiClient.post('/servers/register', serverData)
    return data.data
  },

  getServerWithContainers: async (serverId: number): Promise<any> => {
    const { data } = await apiClient.get(`/servers/monitoting/${serverId}`)
    return data
  },

  getServers: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/all-servers')
    return data
  },

  collectAll: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/monitoring/collect-all')
    return data
  },

  getAllServersWithContainers: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/containers/all')
    return data
  },

  deleteServer: async (serverId: number): Promise<void> => {
    await apiClient.delete(`/servers/delete/${serverId}`)
  },

  updateServer: async (serverId: number, serverData: ServerUpdateRequest): Promise<Server> => {
    const { data } = await apiClient.patch(`/servers/edit/${serverId}`, serverData)
    return data.data
  },
}
