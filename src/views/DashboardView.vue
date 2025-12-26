<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Server,
  Activity,
  HardDrive,
  Cpu,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronUp,
  Box,
  RefreshCw,
} from 'lucide-vue-next'
import { serversApi } from '@/api/servers'
import type { ServerWithHealth, ServerRegisterRequest } from '@/types/api'

const router = useRouter()

// State
const serversData = ref<ServerWithHealth[]>([])
const expandedServers = ref<Set<number>>(new Set())
const loading = ref(false)
const loadingServers = ref<Set<number>>(new Set())
const error = ref('')
const showRegisterModal = ref(false)

// Registration form
const registerForm = ref<ServerRegisterRequest>({
  registrator_id: 0,
  name: '',
  password: '',
  ip_address: '',
  port: 22,
})
const registerError = ref('')
const registerLoading = ref(false)

// Get user ID from token
const getUserId = (): number => {
  const token = localStorage.getItem('access_token')
  if (!token) return 0
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return 0
    const payload = JSON.parse(atob(parts[1]))
    return payload.user_id || 0
  } catch {
    return 0
  }
}

const handleLogout = () => {
  localStorage.removeItem('access_token')
  router.push('/login')
}

const closeRegisterModal = () => {
  showRegisterModal.value = false
  registerForm.value = {
    registrator_id: 0,
    name: '',
    password: '',
    ip_address: '',
    port: 22,
  }
  registerError.value = ''
}

const fetchServersData = async () => {
  loading.value = true
  error.value = ''
  try {
    // Just fetch the list of servers, no health data or containers yet
    const serversResponse = await serversApi.getServers()
    console.log('Full servers response:', serversResponse)

    // Handle different possible response structures
    let servers = []
    if (Array.isArray(serversResponse)) {
      // Response is array directly
      servers = serversResponse
    } else if (serversResponse?.data) {
      // Response is wrapped in { data: [...] }
      if (Array.isArray(serversResponse.data)) {
        servers = serversResponse.data
      } else if (serversResponse.data.data && Array.isArray(serversResponse.data.data)) {
        servers = serversResponse.data.data
      }
    }

    console.log('Extracted servers array:', servers)

    serversData.value = servers.map((item: any) => {
      console.log('Processing server item:', item)
      return {
        server: item,
        current_health: null,
        containers: [],
      }
    })

    console.log('Final mapped servers:', serversData.value)
    console.log('serversData length:', serversData.value.length)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch server data'
    console.error('Failed to fetch servers:', err)
  } finally {
    loading.value = false
  }
}

const refreshAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await serversApi.collectAll()
    if (response?.data) {
      serversData.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to refresh server data'
    console.error('Failed to refresh servers:', err)
  } finally {
    loading.value = false
  }
}

const fetchServerContainers = async (serverId: number) => {
  loadingServers.value.add(serverId)
  try {
    // Fetch both health and containers
    const [healthResponse, containersResponse] = await Promise.all([
      serversApi.getServerHealth(serverId),
      serversApi.getServerContainers(serverId),
    ])

    console.log('Health response:', healthResponse)
    console.log('Containers response:', containersResponse)

    const serverIndex = serversData.value.findIndex((s) => s.server?.id === serverId)
    if (serverIndex !== -1 && serversData.value[serverIndex]) {
      // server-health returns { server: {...}, health: {...} }
      const health = (healthResponse as any)?.health || healthResponse || null
      serversData.value[serverIndex].current_health = health

      // container-data returns array directly or wrapped in data
      const containers = Array.isArray(containersResponse)
        ? containersResponse
        : (containersResponse as any)?.data || []
      serversData.value[serverIndex].containers = containers

      console.log('Updated server at index', serverIndex, serversData.value[serverIndex])
    }
  } catch (err) {
    console.error(`Failed to fetch data for server ${serverId}:`, err)
  } finally {
    loadingServers.value.delete(serverId)
  }
}

const toggleServerExpand = async (serverId: number) => {
  if (expandedServers.value.has(serverId)) {
    expandedServers.value.delete(serverId)
  } else {
    expandedServers.value.add(serverId)
    // Fetch health and containers when expanding if not already loaded
    const server = serversData.value.find((s) => s.server?.id === serverId)
    if (server && !server.current_health) {
      await fetchServerContainers(serverId)
    }
  }
}

const refreshServer = async (serverId: number, event: Event) => {
  event.stopPropagation() // Prevent toggle when clicking refresh
  await fetchServerContainers(serverId)
}

const handleRegisterServer = async () => {
  registerError.value = ''
  registerLoading.value = true

  try {
    const userId = getUserId()
    if (!userId) {
      registerError.value = 'User not authenticated'
      return
    }

    registerForm.value.registrator_id = userId
    await serversApi.register(registerForm.value)

    closeRegisterModal()
    await fetchServersData()
  } catch (err: any) {
    registerError.value = err.response?.data?.error || 'Failed to register server'
  } finally {
    registerLoading.value = false
  }
}

// Computed stats
const stats = computed(() => {
  const total = serversData.value.length
  const healthy = serversData.value.filter((s) => s.current_health?.status === 'healthy').length
  const unhealthy = serversData.value.filter((s) => s.current_health?.status === 'unhealthy').length

  const avgUptime =
    total > 0
      ? serversData.value.reduce((acc, s) => {
          const uptime = s.current_health?.uptime
          if (!uptime || uptime === 'unknown') return acc

          const uptimeMatch = uptime.match(/(\d+)/)
          return acc + (uptimeMatch && uptimeMatch[1] ? parseInt(uptimeMatch[1]) : 0)
        }, 0) / total
      : 0

  return [
    {
      label: 'Total Servers',
      value: total.toString(),
      icon: Server,
      trend: `${total}`,
      color: 'blue',
    },
    {
      label: 'Healthy',
      value: healthy.toString(),
      icon: Activity,
      trend: `${healthy}`,
      color: 'green',
    },
    {
      label: 'Issues',
      value: unhealthy.toString(),
      icon: AlertTriangle,
      trend: `${unhealthy}`,
      color: 'yellow',
    },
    {
      label: 'Avg Uptime',
      value: `${avgUptime.toFixed(1)}%`,
      icon: TrendingUp,
      trend: '+0.1%',
      color: 'purple',
    },
  ]
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'unhealthy':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'offline':
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return CheckCircle2
    case 'unhealthy':
      return AlertTriangle
    case 'offline':
    case 'error':
      return XCircle
    default:
      return Clock
  }
}

const getStatColor = (color: string) => {
  switch (color) {
    case 'blue':
      return 'bg-blue-50 text-blue-600'
    case 'green':
      return 'bg-green-50 text-green-600'
    case 'yellow':
      return 'bg-yellow-50 text-yellow-600'
    case 'purple':
      return 'bg-purple-50 text-purple-600'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

const getUsageColor = (usage: number) => {
  if (usage >= 80) return 'bg-red-500'
  if (usage >= 60) return 'bg-yellow-500'
  return 'bg-green-500'
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

const getContainerStatusColor = (status: string) => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'running':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'stopped':
    case 'paused':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'exited':
    case 'dead':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'restarting':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'created':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200'
  }
}

onMounted(() => {
  fetchServersData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Server class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Skopeto</h1>
              <p class="text-sm text-gray-500">Standing watch over your infrastructure</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="refreshAll"
              :disabled="loading"
              class="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw :class="['w-5 h-5', loading && 'animate-spin']" />
              <span class="font-medium">Refresh</span>
            </button>
            <button
              @click="showRegisterModal = true"
              class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus class="w-5 h-5" />
              <span class="font-medium">Add Server</span>
            </button>
            <button
              @click="handleLogout"
              class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
            >
              <LogOut class="w-5 h-5" />
              <span class="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Error Message -->
      <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 mb-1">{{ stat.label }}</p>
              <p class="text-3xl font-bold text-gray-900 mb-2">{{ stat.value }}</p>
            </div>
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center',
                getStatColor(stat.color),
              ]"
            >
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Servers Section -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Server Status</h2>
              <p class="text-sm text-gray-600 mt-1">Real-time infrastructure monitoring</p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && serversData.length === 0" class="p-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading servers...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="serversData.length === 0" class="p-12 text-center">
          <Server class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No servers registered</h3>
          <p class="text-gray-600 mb-4">Get started by adding your first server to monitor</p>
          <button
            @click="showRegisterModal = true"
            class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
          >
            <Plus class="w-5 h-5" />
            <span>Add Server</span>
          </button>
        </div>

        <!-- Servers List -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="serverData in serversData"
            :key="serverData.server?.id"
            class="hover:bg-gray-50 transition-colors duration-150"
          >
            <!-- Server Row -->
            <div
              @click="serverData.server?.id && toggleServerExpand(serverData.server.id)"
              class="px-6 py-4 cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <!-- Left: Server Info -->
                <div class="flex items-center space-x-4 flex-1 min-w-0">
                  <div class="flex-shrink-0">
                    <div
                      class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center"
                    >
                      <HardDrive class="w-5 h-5 text-gray-700" />
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-3">
                      <h3 class="text-base font-semibold text-gray-900">
                        {{ serverData.server?.user_name }}
                      </h3>
                      <div
                        :class="[
                          'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
                          getStatusColor(serverData.current_health?.status || 'unknown'),
                        ]"
                      >
                        <component
                          :is="getStatusIcon(serverData.current_health?.status || 'unknown')"
                          class="w-3.5 h-3.5"
                        />
                        <span class="capitalize">{{
                          serverData.current_health?.status || 'unknown'
                        }}</span>
                      </div>
                    </div>
                    <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{{ serverData.server?.ip_address }}:{{ serverData.server?.port }}</span>
                      <span
                        v-if="serverData.current_health?.checked_at"
                        class="flex items-center space-x-1"
                      >
                        <Clock class="w-3.5 h-3.5" />
                        <span>{{ formatDate(serverData.current_health.checked_at) }}</span>
                      </span>
                      <span v-else class="text-gray-400">No health check yet</span>
                    </div>
                  </div>
                </div>

                <!-- Middle: Metrics -->
                <div class="hidden lg:flex items-center space-x-8 mr-8">
                  <!-- CPU -->
                  <div class="flex items-center space-x-3">
                    <Cpu class="w-5 h-5 text-gray-400" />
                    <div class="w-32">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-600">CPU</span>
                        <span class="text-xs font-semibold text-gray-900">
                          {{
                            serverData.current_health
                              ? (serverData.current_health.cpu_usage || 0).toFixed(1)
                              : '-'
                          }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          :class="[
                            'h-full rounded-full transition-all duration-300',
                            getUsageColor(serverData.current_health?.cpu_usage || 0),
                          ]"
                          :style="{
                            width: `${Math.min(serverData.current_health?.cpu_usage || 0, 100)}%`,
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Memory -->
                  <div class="flex items-center space-x-3">
                    <Activity class="w-5 h-5 text-gray-400" />
                    <div class="w-32">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-600">Memory</span>
                        <span class="text-xs font-semibold text-gray-900">
                          {{
                            serverData.current_health
                              ? (serverData.current_health.memory_usage || 0).toFixed(1)
                              : '-'
                          }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          :class="[
                            'h-full rounded-full transition-all duration-300',
                            getUsageColor(serverData.current_health?.memory_usage || 0),
                          ]"
                          :style="{
                            width: `${Math.min(serverData.current_health?.memory_usage || 0, 100)}%`,
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Disk -->
                  <div class="flex items-center space-x-3">
                    <HardDrive class="w-5 h-5 text-gray-400" />
                    <div class="w-32">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-600">Disk</span>
                        <span class="text-xs font-semibold text-gray-900">
                          {{
                            serverData.current_health
                              ? (serverData.current_health.disk_usage || 0).toFixed(1)
                              : '-'
                          }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          :class="[
                            'h-full rounded-full transition-all duration-300',
                            getUsageColor(serverData.current_health?.disk_usage || 0),
                          ]"
                          :style="{
                            width: `${Math.min(serverData.current_health?.disk_usage || 0, 100)}%`,
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Expand Button & Container Count -->
                <div class="flex items-center space-x-3">
                  <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <Box class="w-4 h-4" />
                    <span class="font-medium">{{ serverData.containers?.length || 0 }}</span>
                  </div>
                  <button
                    v-if="serverData.server?.id"
                    @click="refreshServer(serverData.server.id, $event)"
                    :disabled="loadingServers.has(serverData.server.id)"
                    class="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Refresh server containers"
                  >
                    <RefreshCw
                      :class="[
                        'w-4 h-4',
                        loadingServers.has(serverData.server.id) && 'animate-spin',
                      ]"
                    />
                  </button>
                  <ChevronDown
                    v-if="serverData.server?.id && !expandedServers.has(serverData.server.id)"
                    class="w-5 h-5 text-gray-400"
                  />
                  <ChevronUp
                    v-else-if="serverData.server?.id && expandedServers.has(serverData.server.id)"
                    class="w-5 h-5 text-gray-400"
                  />
                </div>
              </div>
            </div>

            <!-- Expanded Container List -->
            <div
              v-if="serverData.server?.id && expandedServers.has(serverData.server.id)"
              class="bg-gray-50 border-t border-gray-200"
            >
              <!-- Loading State -->
              <div
                v-if="serverData.server?.id && loadingServers.has(serverData.server.id)"
                class="px-6 py-8 text-center"
              >
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
                ></div>
                <p class="mt-2 text-sm text-gray-600">Loading containers...</p>
              </div>
              <div
                v-else-if="serverData.containers?.length === 0"
                class="px-6 py-8 text-center text-sm text-gray-500"
              >
                No containers found
              </div>
              <div v-else class="px-6 py-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="container in serverData.containers"
                    :key="container.container_id"
                    class="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                        <Box class="w-5 h-5 text-blue-600 mt-0.5" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-gray-900 truncate">
                          {{ container.name }}
                        </h4>
                        <p class="text-xs text-gray-500 truncate mt-0.5">{{ container.image }}</p>
                        <div class="flex items-center space-x-2 mt-2">
                          <span
                            :class="[
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                              getContainerStatusColor(container.status),
                            ]"
                          >
                            {{ container.status }}
                          </span>
                          <span v-if="container.ports" class="text-xs text-gray-500 truncate">{{
                            container.ports
                          }}</span>
                        </div>
                        <p class="text-xs text-gray-400 mt-1 truncate">
                          ID: {{ container.container_id }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Register Server Modal -->
    <div
      v-if="showRegisterModal"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background-color: rgba(0, 0, 0, 0.3)"
      @click.self="closeRegisterModal"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Register New Server</h2>

        <form @submit.prevent="handleRegisterServer" class="space-y-3">
          <!-- SSH Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              SSH Username
              <span class="text-xs text-gray-500 font-normal ml-1">(for server connection)</span>
            </label>
            <input
              v-model="registerForm.name"
              type="text"
              required
              placeholder="e.g., root, ubuntu, admin"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Server IP Address -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Server IP Address
            </label>
            <input
              v-model="registerForm.ip_address"
              type="text"
              required
              placeholder="e.g., 192.168.1.100 or example.com"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- SSH Port -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              SSH Port
              <span class="text-xs text-gray-500 font-normal ml-1">(default: 22)</span>
            </label>
            <input
              v-model.number="registerForm.port"
              type="number"
              required
              placeholder="22"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- SSH Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              SSH Password
              <span class="text-xs text-gray-500 font-normal ml-1">(for the user above)</span>
            </label>
            <input
              v-model="registerForm.password"
              type="password"
              required
              autocomplete="off"
              placeholder="Enter SSH password"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Error Message -->
          <div v-if="registerError" class="rounded-lg bg-red-50 border border-red-200 p-3">
            <p class="text-sm text-red-800">{{ registerError }}</p>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-1">
            <button
              type="button"
              @click="closeRegisterModal"
              class="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="registerLoading"
              class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="registerLoading">Registering...</span>
              <span v-else>Register Server</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
