<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Server as ServerIcon,
  Activity,
  Settings,
  Box,
  LogOut,
  RefreshCw,
  TrendingUp,
  Database as DatabaseIcon,
} from 'lucide-vue-next'
import { serversApi } from '@/api/servers'
import { databasesApi } from '@/api/databases'
import type { MonitoringData, ServerRegisterRequest, ServerUpdateRequest, Server, DatabaseRegisterRequest, DatabaseUpdateRequest, Database, ServerDatabasesData } from '@/types/api'
import TabContainer from '@/components/tabs/TabContainer.vue'
import ServersTab from '@/components/dashboard/ServersTab.vue'
import ServerContainersTab from '@/components/dashboard/ServerContainersTab.vue'
import ServerDatabasesTab from '@/components/dashboard/ServerDatabasesTab.vue'
import ServerManagementTab from '@/components/dashboard/ServerManagementTab.vue'
import DatabaseManagementTab from '@/components/dashboard/DatabaseManagementTab.vue'
import DockerManagementTab from '@/components/dashboard/DockerManagementTab.vue'
import RegisterServerModal from '@/components/modals/RegisterServerModal.vue'
import EditServerModal from '@/components/modals/EditServerModal.vue'
import RegisterDatabaseModal from '@/components/modals/RegisterDatabaseModal.vue'
import EditDatabaseModal from '@/components/modals/EditDatabaseModal.vue'

const router = useRouter()

// State
const monitoringData = ref<MonitoringData[]>([])
const databasesData = ref<ServerDatabasesData[]>([])
const expandedServers = ref<Set<number>>(new Set())
const loading = ref(false)
const loadingDatabases = ref(false)
const loadingServers = ref<Set<number>>(new Set())
const error = ref('')
const showRegisterModal = ref(false)
const registerError = ref('')
const registerLoading = ref(false)
const showEditModal = ref(false)
const editError = ref('')
const editLoading = ref(false)
const serverToEdit = ref<Server | null>(null)
const serverManagementTabRef = ref<InstanceType<typeof ServerManagementTab> | null>(null)

// Database state
const showRegisterDatabaseModal = ref(false)
const registerDatabaseError = ref('')
const registerDatabaseLoading = ref(false)
const selectedServerId = ref<number>(0)
const showEditDatabaseModal = ref(false)
const editDatabaseError = ref('')
const editDatabaseLoading = ref(false)
const databaseToEdit = ref<Database | null>(null)
const databaseManagementTabRef = ref<InstanceType<typeof DatabaseManagementTab> | null>(null)

// Tabs configuration
const tabs = [
  { id: 'servers', label: 'Servers', icon: ServerIcon },
  { id: 'containers', label: 'Servers & Containers', icon: Box },
  { id: 'databases', label: 'Servers & Databases', icon: DatabaseIcon },
  { id: 'management', label: 'Manage Servers', icon: Settings },
  { id: 'manage-databases', label: 'Manage Databases', icon: DatabaseIcon },
  { id: 'docker', label: 'Docker Management', icon: Box },
]

const handleLogout = () => {
  localStorage.removeItem('access_token')
  router.push('/login')
}

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

// Initial load - get all data
const fetchServersData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await serversApi.collectAll()
    if (response?.data) {
      monitoringData.value = Array.isArray(response.data) ? response.data : []

      // Populate databasesData from monitoring data
      databasesData.value = monitoringData.value.map((serverData) => ({
        server: serverData.server,
        current_health: serverData.current_health,
        databases: serverData.databases || []
      }))
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch server data'
  } finally {
    loading.value = false
  }
}

// Fetch data for Servers & Databases tab specifically
const fetchDatabasesData = async () => {
  loadingDatabases.value = true
  error.value = ''
  try {
    const response = await databasesApi.getAllDatabases()
    if (response?.data) {
      databasesData.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch databases data'
  } finally {
    loadingDatabases.value = false
  }
}

// Refresh all data (used by Refresh button)
const refreshAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await serversApi.collectAll()
    if (response?.data) {
      monitoringData.value = Array.isArray(response.data) ? response.data : []

      // Populate databasesData from monitoring data
      databasesData.value = monitoringData.value.map((serverData) => ({
        server: serverData.server,
        current_health: serverData.current_health,
        databases: serverData.databases || []
      }))
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to refresh server data'
  } finally {
    loading.value = false
  }
}

const fetchServerContainers = async (serverId: number) => {
  loadingServers.value.add(serverId)
  try {
    const response = await serversApi.getServerWithContainers(serverId)

    const serverIndex = monitoringData.value.findIndex((s) => s.server?.id === serverId)
    if (serverIndex !== -1 && monitoringData.value[serverIndex] && response?.data) {
      // Store existing databases before updating
      const existingDatabases = monitoringData.value[serverIndex].databases || []

      monitoringData.value[serverIndex].server =
        response.data.server || monitoringData.value[serverIndex].server
      monitoringData.value[serverIndex].current_health = response.data.current_health || null
      monitoringData.value[serverIndex].containers = response.data.containers || []

      // Only update databases if they're included in the response, otherwise preserve existing
      if (response.data.databases !== undefined) {
        monitoringData.value[serverIndex].databases = response.data.databases
      } else {
        monitoringData.value[serverIndex].databases = existingDatabases
      }

      // Also update databasesData for the same server
      const dbIndex = databasesData.value.findIndex((s) => s.server?.id === serverId)
      if (dbIndex !== -1) {
        databasesData.value[dbIndex] = {
          server: monitoringData.value[serverIndex].server,
          current_health: monitoringData.value[serverIndex].current_health,
          databases: monitoringData.value[serverIndex].databases || []
        }
      }
    }
  } catch (err) {
    // Silently fail - error handling can be added if needed
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
    const server = monitoringData.value.find((s) => s.server?.id === serverId)
    if (server && !server.current_health) {
      await fetchServerContainers(serverId)
    }
  }
}

const refreshServer = async (serverId: number, event: Event) => {
  event.stopPropagation() // Prevent toggle when clicking refresh
  await fetchServerContainers(serverId)
}

const refreshServerDatabases = async (_serverId: number, event: Event) => {
  event.stopPropagation() // Prevent toggle when clicking refresh
  await fetchDatabasesData()
}

const handleRegisterServer = async (formData: ServerRegisterRequest) => {
  registerError.value = ''
  registerLoading.value = true

  try {
    const userId = getUserId()
    if (!userId) {
      registerError.value = 'User not authenticated'
      return
    }

    formData.registrator_id = userId
    await serversApi.register(formData)

    showRegisterModal.value = false
    registerError.value = ''
    await fetchServersData()
  } catch (err: any) {
    registerError.value = err.response?.data?.error || 'Failed to register server'
  } finally {
    registerLoading.value = false
  }
}

const handleDeleteServer = async (serverId: number) => {
  try {
    await serversApi.deleteServer(serverId)
    // Refresh server list after successful deletion
    await fetchServersData()
    // Close the delete confirmation dialog in the ServerManagementTab
    serverManagementTabRef.value?.closeDeleteDialog()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete server'
  }
}

const handleEditServer = (serverId: number) => {
  const serverData = monitoringData.value.find((s) => s.server?.id === serverId)
  if (serverData?.server) {
    serverToEdit.value = serverData.server
    editError.value = ''
    showEditModal.value = true
  }
}

const handleUpdateServer = async (formData: ServerUpdateRequest) => {
  if (!serverToEdit.value) return

  editError.value = ''
  editLoading.value = true

  try {
    await serversApi.updateServer(serverToEdit.value.id, formData)
    showEditModal.value = false
    editError.value = ''
    serverToEdit.value = null
    await fetchServersData()
  } catch (err: any) {
    editError.value = err.response?.data?.error || 'Failed to update server'
  } finally {
    editLoading.value = false
  }
}

// Database handlers
const handleAddDatabase = (serverId: number) => {
  selectedServerId.value = serverId
  registerDatabaseError.value = ''
  showRegisterDatabaseModal.value = true
}

const handleRegisterDatabase = async (formData: DatabaseRegisterRequest) => {
  registerDatabaseError.value = ''
  registerDatabaseLoading.value = true

  try {
    await databasesApi.register(formData)
    showRegisterDatabaseModal.value = false
    registerDatabaseError.value = ''
    await fetchServersData()
  } catch (err: any) {
    registerDatabaseError.value = err.response?.data?.error || 'Failed to register database'
  } finally {
    registerDatabaseLoading.value = false
  }
}

const handleDeleteDatabase = async (databaseId: number) => {
  try {
    await databasesApi.deleteDatabase(databaseId)
    await fetchServersData()
    databaseManagementTabRef.value?.closeDeleteDialog()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete database'
  }
}

const handleEditDatabase = (databaseId: number) => {
  // Find the database in the monitoring data
  for (const serverData of monitoringData.value) {
    const dbData = serverData.databases?.find((d) => d.database.id === databaseId)
    if (dbData) {
      databaseToEdit.value = dbData.database
      editDatabaseError.value = ''
      showEditDatabaseModal.value = true
      break
    }
  }
}

const handleUpdateDatabase = async (formData: DatabaseUpdateRequest) => {
  if (!databaseToEdit.value) return

  editDatabaseError.value = ''
  editDatabaseLoading.value = true

  try {
    await databasesApi.updateDatabase(databaseToEdit.value.id!, formData)
    showEditDatabaseModal.value = false
    editDatabaseError.value = ''
    databaseToEdit.value = null
    await fetchServersData()
  } catch (err: any) {
    editDatabaseError.value = err.response?.data?.error || 'Failed to update database'
  } finally {
    editDatabaseLoading.value = false
  }
}

// Computed server list for dropdowns
const serversList = computed(() => {
  return monitoringData.value.map((data) => ({
    id: data.server.id,
    name: data.server.user_name,
    ip_address: data.server.ip_address,
  }))
})

// Computed stats
const stats = computed(() => {
  const total = monitoringData.value.length
  const healthy = monitoringData.value.filter((s) => s.current_health?.status === 'healthy').length
  const unhealthy = monitoringData.value.filter((s) => s.current_health?.status === 'unhealthy').length

  const avgUptime =
    total > 0
      ? monitoringData.value.reduce((acc, s) => {
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
      icon: ServerIcon,
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
      icon: Activity,
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
              <ServerIcon class="w-6 h-6 text-white" />
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

      <!-- Tabbed Interface -->
      <TabContainer :tabs="tabs" storage-key="dashboard-active-tab">
        <template #servers>
          <ServersTab
            :monitoring-data="monitoringData"
            :stats="stats"
            :loading="loading"
            :loading-servers="loadingServers"
            @refresh-server="refreshServer"
          />
        </template>

        <template #containers>
          <ServerContainersTab
            :monitoring-data="monitoringData"
            :stats="stats"
            :loading="loading"
            :loading-servers="loadingServers"
            :expanded-servers="expandedServers"
            @toggle-expand="toggleServerExpand"
            @refresh-server="refreshServer"
          />
        </template>

        <template #databases>
          <ServerDatabasesTab
            :databases-data="databasesData"
            :stats="stats"
            :loading="loadingDatabases"
            :loading-servers="loadingServers"
            :expanded-servers="expandedServers"
            @toggle-expand="toggleServerExpand"
            @refresh-server="refreshServerDatabases"
            @refresh-databases="fetchDatabasesData"
          />
        </template>

        <template #management>
          <ServerManagementTab
            ref="serverManagementTabRef"
            :servers="monitoringData"
            @add="showRegisterModal = true"
            @delete="handleDeleteServer"
            @edit="handleEditServer"
          />
        </template>

        <template #manage-databases>
          <DatabaseManagementTab
            ref="databaseManagementTabRef"
            :monitoring-data="monitoringData"
            @add="handleAddDatabase"
            @delete="handleDeleteDatabase"
            @edit="handleEditDatabase"
          />
        </template>

        <template #docker>
          <DockerManagementTab />
        </template>
      </TabContainer>
    </main>

    <!-- Register Server Modal -->
    <RegisterServerModal
      :show="showRegisterModal"
      :loading="registerLoading"
      :error="registerError"
      @close="showRegisterModal = false"
      @submit="handleRegisterServer"
    />

    <!-- Edit Server Modal -->
    <EditServerModal
      :show="showEditModal"
      :loading="editLoading"
      :error="editError"
      :server="serverToEdit"
      @close="showEditModal = false"
      @submit="handleUpdateServer"
    />

    <!-- Register Database Modal -->
    <RegisterDatabaseModal
      :show="showRegisterDatabaseModal"
      :loading="registerDatabaseLoading"
      :error="registerDatabaseError"
      :server-id="selectedServerId"
      :servers="serversList"
      @close="showRegisterDatabaseModal = false"
      @submit="handleRegisterDatabase"
    />

    <!-- Edit Database Modal -->
    <EditDatabaseModal
      :show="showEditDatabaseModal"
      :loading="editDatabaseLoading"
      :error="editDatabaseError"
      :database="databaseToEdit"
      :servers="serversList"
      @close="showEditDatabaseModal = false"
      @submit="handleUpdateDatabase"
    />
  </div>
</template>
