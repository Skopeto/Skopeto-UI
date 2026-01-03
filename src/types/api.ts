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

export interface ServerRegisterRequest {
  registrator_id: number
  name: string
  password: string
  ip_address: string
  port: number
  status?: 'up' | 'down' | 'decommissioned' | 'inactive' | null
}

export interface ServerUpdateRequest {
  name?: string
  password?: string
  ip_address?: string
  port?: number
  status?: 'up' | 'down' | 'decommissioned' | 'inactive'
}

export interface Server {
  id: number
  user_name: string
  ssh_password_encrypted: string
  ip_address: string
  port: number
  status: 'up' | 'down' | 'decommissioned' | 'inactive'
}

export interface ServerHealth {
  id: number | null
  server_id: number
  status: 'healthy' | 'unhealthy' | 'offline' | 'error'
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  uptime: string
  checked_at: string
}

export interface Container {
  id?: number
  server_id: number
  container_id: string
  name: string
  image: string
  status: string
  ports?: string
  last_seen_at?: string
  created_at?: string
  updated_at?: string
}

export interface Database {
  id?: number
  server_id: number
  name: string
  db_type: string
  host: string
  port: number
  database_name?: string
  service_name?: string
  username: string
  password?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseHealth {
  id?: number | null
  database_id: number
  status: 'healthy' | 'unhealthy' | 'offline' | 'error'
  is_connected: boolean
  connection_time_ms: number
  query_time_ms: number
  error_message: string | null
  checked_at: string
}

export interface DatabaseWithHealth {
  database: Database
  database_health: DatabaseHealth
}

export interface ServerWithHealth {
  server: Server
  current_health: ServerHealth
  containers: Container[]
  databases?: DatabaseWithHealth[]
}

export interface MonitoringData {
  server: Server
  current_health: ServerHealth
  containers: Container[]
  databases: DatabaseWithHealth[]
}

export interface ContainerDataRequest {
  server_id: number
}

export interface DatabaseRegisterRequest {
  server_id: number
  name: string
  db_type: string
  host: string
  port: number
  database_name?: string
  service_name?: string
  username: string
  password: string
}

export interface DatabaseUpdateRequest {
  server_id?: number
  name?: string
  db_type?: string
  host?: string
  port?: number
  database_name?: string
  service_name?: string
  username?: string
  password?: string
}

export interface ServerDatabasesData {
  server: Server
  current_health: ServerHealth
  databases: DatabaseWithHealth[]
}
