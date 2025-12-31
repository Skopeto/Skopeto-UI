<script setup lang="ts">
import {
  HardDrive,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Server,
} from 'lucide-vue-next'
import StatsGrid from './StatsGrid.vue'
import type { ServerDatabasesData } from '@/types/api'
import type { Component } from 'vue'

interface Stat {
  label: string
  value: string
  icon: Component
  trend: string
  color: string
}

defineProps<{
  databasesData: ServerDatabasesData[]
  stats: Stat[]
  loading: boolean
  loadingServers: Set<number>
  expandedServers: Set<number>
}>()

defineEmits<{
  'toggle-expand': [serverId: number]
  'refresh-server': [serverId: number, event: Event]
  'refresh-databases': []
}>()

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

const getDatabaseTypeColor = (type: string) => {
  const typeLower = type.toLowerCase()
  switch (typeLower) {
    case 'postgresql':
    case 'postgres':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'mysql':
    case 'mariadb':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'mongodb':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'redis':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'sqlite':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'oracle':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default:
      return 'bg-purple-100 text-purple-700 border-purple-200'
  }
}
</script>

<template>
  <div class="p-6">
    <!-- Stats Grid -->
    <StatsGrid :stats="stats" />

    <!-- Servers Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Servers & Databases</h2>
            <p class="text-sm text-gray-600 mt-1">Monitor server health and database connections</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && databasesData.length === 0" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading databases...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="databasesData.length === 0" class="p-12 text-center">
        <Server class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No servers with databases</h3>
        <p class="text-gray-600">Add databases to your servers to see them here</p>
      </div>

      <!-- Servers List -->
      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="serverData in databasesData"
          :key="serverData.server?.id"
          class="hover:bg-gray-50 transition-colors duration-150"
        >
          <!-- Server Row -->
          <div
            @click="serverData.server?.id && $emit('toggle-expand', serverData.server.id)"
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
                    <h3 class="text-base font-bold text-gray-900">
                      {{ serverData.server?.ip_address }}:{{ serverData.server?.port }}
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
                    <span>{{ serverData.server?.user_name }}</span>
                    <span
                      v-if="serverData.current_health?.checked_at"
                      class="flex items-center space-x-1"
                    >
                      <Clock class="w-3.5 h-3.5" />
                      <span
                        >Last snapshot at {{ formatDate(serverData.current_health.checked_at) }}</span
                      >
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
                            ? Number(serverData.current_health.cpu_usage || 0).toFixed(1)
                            : '-'
                        }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        :class="[
                          'h-full rounded-full transition-all duration-300',
                          getUsageColor(Number(serverData.current_health?.cpu_usage || 0)),
                        ]"
                        :style="{
                          width: `${Math.min(Number(serverData.current_health?.cpu_usage || 0), 100)}%`,
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
                            ? Number(serverData.current_health.memory_usage || 0).toFixed(1)
                            : '-'
                        }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        :class="[
                          'h-full rounded-full transition-all duration-300',
                          getUsageColor(Number(serverData.current_health?.memory_usage || 0)),
                        ]"
                        :style="{
                          width: `${Math.min(Number(serverData.current_health?.memory_usage || 0), 100)}%`,
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
                            ? Number(serverData.current_health.disk_usage || 0).toFixed(1)
                            : '-'
                        }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        :class="[
                          'h-full rounded-full transition-all duration-300',
                          getUsageColor(Number(serverData.current_health?.disk_usage || 0)),
                        ]"
                        :style="{
                          width: `${Math.min(Number(serverData.current_health?.disk_usage || 0), 100)}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Expand Button & Database Count -->
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <Database class="w-4 h-4" />
                  <span class="font-medium">{{ serverData.databases?.length || 0 }}</span>
                </div>
                <button
                  v-if="serverData.server?.id"
                  @click="$emit('refresh-server', serverData.server.id, $event)"
                  :disabled="loadingServers.has(serverData.server.id)"
                  class="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Refresh server databases"
                >
                  <RefreshCw
                    :class="['w-4 h-4', loadingServers.has(serverData.server.id) && 'animate-spin']"
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

          <!-- Expanded Database List -->
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
              <p class="mt-2 text-sm text-gray-600">Loading databases...</p>
            </div>
            <div
              v-else-if="serverData.databases?.length === 0"
              class="px-6 py-8 text-center text-sm text-gray-500"
            >
              No databases found
            </div>
            <div v-else class="px-6 py-4">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="dbData in serverData.databases"
                  :key="dbData.database.id"
                  class="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                >
                  <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                      <Database class="w-5 h-5 text-purple-600 mt-0.5" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-semibold text-gray-900 truncate">
                        {{ dbData.database.name }}
                      </h4>
                      <p class="text-xs text-gray-500 truncate mt-0.5">
                        {{ dbData.database.host }}:{{ dbData.database.port }}
                      </p>
                      <p v-if="dbData.database.database_name" class="text-xs text-gray-500 truncate">
                        DB: {{ dbData.database.database_name }}
                      </p>
                      <div class="flex items-center space-x-2 mt-2">
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                            getDatabaseTypeColor(dbData.database.db_type),
                          ]"
                        >
                          {{ dbData.database.db_type }}
                        </span>
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                            getStatusColor(dbData.database_health.status),
                          ]"
                        >
                          {{ dbData.database_health.status }}
                        </span>
                      </div>
                      <div class="mt-2 text-xs text-gray-500 space-y-1">
                        <div class="flex items-center space-x-2">
                          <span>Connection: {{ dbData.database_health.connection_time_ms.toFixed(2) }}ms</span>
                          <span>•</span>
                          <span>Query: {{ dbData.database_health.query_time_ms.toFixed(2) }}ms</span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <span
                            :class="
                              dbData.database_health.is_connected
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            "
                          >
                            {{
                              dbData.database_health.is_connected ? 'Connected' : 'Disconnected'
                            }}
                          </span>
                          <span v-if="dbData.database_health.checked_at">
                            •
                            {{ formatDate(dbData.database_health.checked_at) }}
                          </span>
                        </div>
                        <div
                          v-if="dbData.database_health.error_message"
                          class="text-red-600 font-medium"
                        >
                          Error: {{ dbData.database_health.error_message }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
