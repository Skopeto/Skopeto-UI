import apiClient from './client'
import type { ServerRegisterRequest, Server, ServerHealth, ContainerDataRequest } from '@/types/api'

export const serversApi = {
  register: async (serverData: ServerRegisterRequest): Promise<Server> => {
    const { data } = await apiClient.post('/servers/register', serverData)
    return data.data
  },

  getServerHealth: async (serverId: number): Promise<ServerHealth> => {
    const { data } = await apiClient.get(`/servers/server-health/${serverId}`)
    return data
  },

  getServers: async (): Promise<any> => {
    const { data } = await apiClient.get('/servers/all-servers')
    return data
  },

  getServerContainers: async (serverId: number): Promise<any> => {
    const requestData: ContainerDataRequest = { server_id: serverId }
    const { data } = await apiClient.post('/containers/get-container-data', requestData)
    return data
  },

  collectAll: async (): Promise<any> => {
    const { data } = await apiClient.post('/servers/monitoring/collect-all')
    return data
  },
}
