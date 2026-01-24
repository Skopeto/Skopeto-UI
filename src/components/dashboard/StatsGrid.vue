<script setup lang="ts">
import type { Component } from 'vue'

interface Stat {
  label: string
  value: string
  icon: Component
  trend: string
  color: string
}

defineProps<{
  stats: Stat[]
}>()

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
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="bg-white rounded-xl shadow-md border border-gray-100 px-4 py-3 hover:shadow-lg transition-shadow duration-200"
    >
      <div class="flex items-center space-x-3">
        <div
          :class="[
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            getStatColor(stat.color),
          ]"
        >
          <component :is="stat.icon" class="w-5 h-5" />
        </div>
        <div class="flex items-center space-x-2 min-w-0">
          <span class="text-sm font-medium text-gray-600 whitespace-nowrap">{{ stat.label }}:</span>
          <span class="text-xl font-bold text-gray-900">{{ stat.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
