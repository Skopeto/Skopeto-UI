import apiClient from './client'
import type {
  NotificationSubscriber,
  RegisterNotificationSubscriberRequest,
  UpdateNotificationSubscriberRequest,
} from '@/types/api'

export const notificationsApi = {
  // Subscriber Management
  getSubscribers: async (): Promise<NotificationSubscriber[]> => {
    const { data } = await apiClient.get('/notifications/subscribers')
    return data.data
  },

  registerSubscriber: async (
    subscriberData: RegisterNotificationSubscriberRequest,
  ): Promise<NotificationSubscriber> => {
    const { data } = await apiClient.post('/notifications/subscriber', subscriberData)
    return data.data
  },

  updateSubscriber: async (
    subscriberId: number,
    subscriberData: UpdateNotificationSubscriberRequest,
  ): Promise<NotificationSubscriber> => {
    const { data } = await apiClient.patch(
      `/notifications/subscribers/${subscriberId}`,
      subscriberData,
    )
    return data.data
  },

  deleteSubscriber: async (subscriberId: number): Promise<void> => {
    await apiClient.delete(`/notifications/subscribers/${subscriberId}`)
  },

  // Notification Management
  markAsRead: async (notificationId: number): Promise<void> => {
    await apiClient.post(`/notifications/markAsRead/${notificationId}`)
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`)
  },
}
