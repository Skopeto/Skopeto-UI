<script setup lang="ts">
import { Trash2, Edit, Terminal } from 'lucide-vue-next'
import type { ServerCheck } from '@/types/api'

defineProps<{
  check: ServerCheck
}>()

defineEmits<{
  delete: []
  edit: []
}>()

const getOperatorColor = (operator: string) => {
  switch (operator) {
    case '>':
    case '>=':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case '<':
    case '<=':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case '==':
      return 'text-green-600 bg-green-50 border-green-200'
    case '!=':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const truncateCommand = (command: string, maxLength: number = 50) => {
  if (command.length <= maxLength) return command
  return command.substring(0, maxLength) + '...'
}
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-md border border-gray-100 px-5 py-3 hover:shadow-lg transition-all duration-200"
  >
    <div class="flex items-center justify-between">
      <!-- Left: Check Info -->
      <div class="flex items-center space-x-3 min-w-0">
        <Terminal class="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-semibold text-gray-900 truncate">
              {{ check.name }}
            </h3>
          </div>
          <p class="text-xs text-gray-500 truncate font-mono" :title="check.command">
            {{ truncateCommand(check.command) }}
          </p>
        </div>
      </div>

      <!-- Middle: Threshold & Operator -->
      <div class="flex items-center space-x-3 flex-shrink-0">
        <div
          :class="[
            'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
            getOperatorColor(check.operator),
          ]"
        >
          <span class="font-mono">{{ check.operator }}</span>
          <span>{{ check.threshold }}</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
        <button
          @click="$emit('edit')"
          class="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Edit class="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          @click="$emit('delete')"
          class="flex items-center justify-center p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
