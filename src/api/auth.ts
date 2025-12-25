import apiClient from './client'
import type { LoginRequest, RegisterRequest, Token, User } from '@/types/api'

export const authApi = {
  login: async (credentials: LoginRequest): Promise<Token> => {
    const { data } = await apiClient.post('/auth/login', credentials)
    return data.data
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const { data } = await apiClient.post('/auth/register', userData)
    return data.data
  },
}