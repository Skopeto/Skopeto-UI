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
  roles?: string[]
  is_active?: boolean
  is_superuser?: boolean
  created_at?: string
  updated_at?: string
}

export interface UpdateUserRequest {
  first_name?: string | null
  last_name?: string | null
  user_name?: string | null
  email?: string | null
  is_active?: boolean | null
  roles?: string[] | null
  current_password?: string | null
  new_password?: string | null
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

export interface CheckResult {
  server_id: number
  status: 'healthy' | 'unhealthy' | 'offline' | 'error'
  check_name: string
  value: number
  unit: string
  uptime: number
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
  check_results: CheckResult[]
  containers: Container[]
  databases?: DatabaseWithHealth[]
}

export interface MonitoringData {
  server: Server
  check_results: CheckResult[]
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
  check_results: CheckResult[]
  databases: DatabaseWithHealth[]
}

export interface NotificationSubscriber {
  id: number
  user_id: number
  user_name: string
  first_name: string
  last_name: string
  delivery_address_email: string | null
  notification_channel: 'email' | 'slack' | 'sms'
  slack_webhook_url: string | null
  is_active: boolean
  subscribed_at: string
}

export interface RegisterNotificationSubscriberRequest {
  user_id: number
  user_name: string
  first_name: string
  last_name: string
  delivery_address_email?: string | null
  slack_webhook_url?: string | null
  notification_channel: 'email' | 'slack' | 'sms'
  subscribed_at?: string | null
}

export interface UpdateNotificationSubscriberRequest {
  delivery_address_email?: string | null
  slack_webhook_url?: string | null
  notification_channel?: 'email' | 'slack' | 'sms' | null
  is_active?: boolean | null
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export interface ServerCheck {
  health_check_id: number
  name: string
  command: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  unit?: string
  check_status: 'active' | 'inactive'
}

export interface RegisterServerCheckRequest {
  name: string
  command: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  unit?: string
}

export interface UpdateServerCheckRequest {
  name?: string
  command?: string
  threshold?: number
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!='
  unit?: string
  check_status?: 'active' | 'inactive'
}
