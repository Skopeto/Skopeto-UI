import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notificationsApi } from '@/api/notifications'
import type { Notification } from '@/types/api'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref('')

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.is_read).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications(userId: number) {
    loading.value = true
    error.value = ''
    try {
      const data = await notificationsApi.getUserNotifications(userId)
      notifications.value = data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch notifications'
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId: number) {
    try {
      await notificationsApi.markAsRead(notificationId)
      // Update local state optimistically
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.is_read = true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to mark notification as read'
    }
  }

  function clearNotifications() {
    notifications.value = []
    error.value = ''
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    hasUnread,
    fetchNotifications,
    markAsRead,
    clearNotifications,
  }
})
