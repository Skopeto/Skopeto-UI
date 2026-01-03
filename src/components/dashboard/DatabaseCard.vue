<script setup lang="ts">
import { Trash2, Edit, Database, CheckCircle2, AlertTriangle, XCircle, Clock, Server } from 'lucide-vue-next'
import type { Database as DatabaseType, DatabaseHealth, Server as ServerType } from '@/types/api'

defineProps<{
  database: DatabaseType
  health: DatabaseHealth | null
  server: ServerType
}>()

defineEmits<{
  delete: []
  edit: []
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

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
  >
    <!-- Database Info -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-bold text-gray-900 truncate">
          {{ database.name }}
        </h3>
        <div class="flex items-center space-x-2 mt-1">
          <Server class="w-3.5 h-3.5 text-gray-400" />
          <p class="text-sm text-gray-600">{{ database.host }}:{{ database.port }}</p>
        </div>
        <p v-if="database.database_name" class="text-xs text-gray-500 mt-0.5">
          DB: {{ database.database_name }}
        </p>
      </div>
      <div
        v-if="health"
        :class="[
          'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
          getStatusColor(health.status),
        ]"
      >
        <component :is="getStatusIcon(health.status)" class="w-3.5 h-3.5" />
        <span class="capitalize">{{ health.status }}</span>
      </div>
      <div
        v-else
        class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium text-gray-600 bg-gray-50 border-gray-200"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>Unknown</span>
      </div>
    </div>

    <!-- Database Type Badge -->
    <div class="mb-4">
      <span
        :class="[
          'inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border',
          getDatabaseTypeColor(database.db_type),
        ]"
      >
        <Database class="w-4 h-4 mr-1.5" />
        {{ database.db_type }}
      </span>
    </div>

    <!-- Health Metrics -->
    <div v-if="health" class="mb-4 space-y-2 text-xs">
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Connection Status</span>
        <span :class="health.is_connected ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
          {{ health.is_connected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Connection Time</span>
        <span class="text-gray-900 font-medium">{{ health.connection_time_ms.toFixed(2) }}ms</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Query Time</span>
        <span class="text-gray-900 font-medium">{{ health.query_time_ms.toFixed(2) }}ms</span>
      </div>
      <div v-if="health.checked_at" class="flex items-center justify-between">
        <span class="text-gray-600">Last Checked</span>
        <span class="text-gray-900 font-medium">{{ formatDate(health.checked_at) }}</span>
      </div>
      <div v-if="health.error_message" class="pt-1 border-t border-gray-200">
        <span class="text-red-600 font-medium">Error: {{ health.error_message }}</span>
      </div>
    </div>

    <!-- No Health Data -->
    <div v-else class="mb-4 text-center text-sm text-gray-500 py-2">No health data available</div>

    <!-- Actions -->
    <div class="flex space-x-2 pt-2 border-t border-gray-100">
      <button
        @click="$emit('edit')"
        class="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <Edit class="w-4 h-4" />
        <span>Edit</span>
      </button>
      <button
        @click="$emit('delete')"
        class="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
