<script setup lang="ts">
import {
  HardDrive,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Server,
} from 'lucide-vue-next'
import StatsGrid from './StatsGrid.vue'
import type { MonitoringData } from '@/types/api'
import type { Component } from 'vue'

interface Stat {
  label: string
  value: string
  icon: Component
  trend: string
  color: string
}

defineProps<{
  monitoringData: MonitoringData[]
  stats: Stat[]
  loading: boolean
  loadingServers: Set<number>
}>()

defineEmits<{
  'refresh-server': [serverId: number, event: Event]
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
            <h2 class="text-xl font-bold text-gray-900">Server Overview</h2>
            <p class="text-sm text-gray-600 mt-1">Monitor server health and performance metrics</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && monitoringData.length === 0" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading servers...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="monitoringData.length === 0" class="p-12 text-center">
        <Server class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No servers registered</h3>
        <p class="text-gray-600">Get started by adding your first server to monitor</p>
      </div>

      <!-- Servers List -->
      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="serverData in monitoringData"
          :key="serverData.server?.id"
          class="hover:bg-gray-50 transition-colors duration-150"
        >
          <!-- Server Row -->
          <div class="px-6 py-4">
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

                <!-- Uptime -->
                <div class="flex items-center space-x-3">
                  <Clock class="w-5 h-5 text-gray-400" />
                  <div>
                    <div class="text-xs font-medium text-gray-600 mb-0.5">Uptime</div>
                    <div class="text-xs font-semibold text-gray-900">
                      {{ serverData.current_health?.uptime || 'N/A' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Refresh Button -->
              <div class="flex items-center space-x-3">
                <button
                  v-if="serverData.server?.id"
                  @click="$emit('refresh-server', serverData.server.id, $event)"
                  :disabled="loadingServers.has(serverData.server.id)"
                  class="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Refresh server data"
                >
                  <RefreshCw
                    :class="['w-4 h-4', loadingServers.has(serverData.server.id) && 'animate-spin']"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
