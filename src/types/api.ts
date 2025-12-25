export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  user_name: string
  first_name: string
  last_name: string
  email: string
  password: string
  user_type: string
}

export interface Token {
  access_token: string
  token_type: string
  expires_at: string
  user_id: number
}

export interface User {
  id: number
  user_name: string
  first_name: string
  last_name: string
  email: string
}