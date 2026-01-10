<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/api'

const props = defineProps<{
  show: boolean
  notifications: Notification[]
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  'notification-click': [id: number]
}>()

const sortedNotifications = computed(() => {
  return [...props.notifications].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div
    v-if="show"
    class="absolute right-0 top-full mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50"
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
    </div>

    <!-- Notifications List -->
    <div class="max-h-[500px] overflow-y-auto">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Loading notifications...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="sortedNotifications.length === 0" class="p-8 text-center">
        <p class="text-gray-500">No notifications</p>
      </div>

      <!-- Notification Items -->
      <div v-else>
        <button
          v-for="notification in sortedNotifications"
          :key="notification.id"
          @click="$emit('notification-click', notification.id!)"
          class="w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
          :class="{ 'bg-blue-50': !notification.is_read }"
        >
          <!-- Unread indicator -->
          <div class="flex items-start space-x-3">
            <div
              v-if="!notification.is_read"
              class="w-2 h-2 mt-2 bg-blue-600 rounded-full flex-shrink-0"
            ></div>
            <div v-else class="w-2 flex-shrink-0"></div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ notification.title }}</p>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ notification.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatTime(notification.created_at) }}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
