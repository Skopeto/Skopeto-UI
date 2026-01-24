<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

defineProps<{
  unreadCount: number
  hasUnread: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="$emit('click')"
    class="relative flex items-center space-x-2 px-4 py-2 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
  >
    <Bell class="w-5 h-5" />
    <span class="font-medium">Notifications</span>

    <!-- Red badge indicator -->
    <span
      v-if="hasUnread"
      class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full"
    >
      {{ unreadCount }}
    </span>
  </button>
</template>
