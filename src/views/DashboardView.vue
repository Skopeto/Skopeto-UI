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
} from 'lucide-vue-next'
import { serversApi } from '@/api/servers'
import type { ServerWithHealth, ServerRegisterRequest, ServerUpdateRequest, Server } from '@/types/api'
import TabContainer from '@/components/tabs/TabContainer.vue'
import ServerStatusTab from '@/components/dashboard/ServerStatusTab.vue'
import ServerManagementTab from '@/components/dashboard/ServerManagementTab.vue'
import DockerManagementTab from '@/components/dashboard/DockerManagementTab.vue'
import RegisterServerModal from '@/components/modals/RegisterServerModal.vue'
import EditServerModal from '@/components/modals/EditServerModal.vue'

const router = useRouter()

// State
const serversData = ref<ServerWithHealth[]>([])
const expandedServers = ref<Set<number>>(new Set())
const loading = ref(false)
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

// Tabs configuration
const tabs = [
  { id: 'status', label: 'Server Status', icon: Activity },
  { id: 'management', label: 'Server Management', icon: Settings },
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

const fetchServersData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await serversApi.getAllServersWithContainers()
    serversData.value = response?.data || []
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch server data'
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
  } finally {
    loading.value = false
  }
}

const fetchServerContainers = async (serverId: number) => {
  loadingServers.value.add(serverId)
  try {
    const response = await serversApi.getServerWithContainers(serverId)

    const serverIndex = serversData.value.findIndex((s) => s.server?.id === serverId)
    if (serverIndex !== -1 && serversData.value[serverIndex] && response?.data) {
      serversData.value[serverIndex].server =
        response.data.server || serversData.value[serverIndex].server
      serversData.value[serverIndex].current_health = response.data.current_health || null
      serversData.value[serverIndex].containers = response.data.containers || []
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
  const serverData = serversData.value.find((s) => s.server?.id === serverId)
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
        <template #status>
          <ServerStatusTab
            :servers="serversData"
            :stats="stats"
            :loading="loading"
            :loading-servers="loadingServers"
            :expanded-servers="expandedServers"
            @toggle-expand="toggleServerExpand"
            @refresh-server="refreshServer"
          />
        </template>

        <template #management>
          <ServerManagementTab
            ref="serverManagementTabRef"
            :servers="serversData"
            @add="showRegisterModal = true"
            @delete="handleDeleteServer"
            @edit="handleEditServer"
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
  </div>
</template>
