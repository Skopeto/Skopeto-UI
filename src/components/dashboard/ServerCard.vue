<script setup lang="ts">
import { Trash2, Edit, Gauge, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-vue-next'
import type { Server, CheckResult } from '@/types/api'
import {
  getOverallStatus,
  formatCheckValue,
  isPercentageCheck,
} from '@/utils/healthUtils'

withDefaults(defineProps<{
  server: Server
  checkResults: CheckResult[] | null
  showHealth?: boolean
}>(), {
  showHealth: true
})

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
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
  >
    <!-- Server Info -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-bold text-gray-900 truncate">
          {{ server.ip_address }}:{{ server.port }}
        </h3>
        <p class="text-sm text-gray-600">{{ server.user_name }}</p>
      </div>
      <div
        v-if="showHealth && checkResults?.length"
        :class="[
          'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
          getStatusColor(getOverallStatus(checkResults)),
        ]"
      >
        <component :is="getStatusIcon(getOverallStatus(checkResults))" class="w-3.5 h-3.5" />
        <span class="capitalize">{{ getOverallStatus(checkResults) }}</span>
      </div>
      <div
        v-else-if="showHealth"
        class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium text-gray-600 bg-gray-50 border-gray-200"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>Unknown</span>
      </div>
    </div>

    <!-- Dynamic Metrics Preview -->
    <div v-if="showHealth && checkResults?.length" class="grid grid-cols-3 gap-3 mb-4">
      <template v-for="check in checkResults.slice(0, 3)" :key="check.check_name">
        <div v-if="isPercentageCheck(check.unit)" class="text-center">
          <Gauge class="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p class="text-xs font-medium text-gray-600 truncate">{{ check.check_name }}</p>
          <p class="text-sm font-bold text-gray-900">
            {{ formatCheckValue(check.value, check.unit) }}
          </p>
        </div>
      </template>
    </div>

    <!-- No Health Data -->
    <div v-else-if="showHealth" class="mb-4 text-center text-sm text-gray-500 py-2">No health data available</div>

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
