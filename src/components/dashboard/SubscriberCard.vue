<script setup lang="ts">
import {
  Trash2,
  Edit,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-vue-next'
import type { NotificationSubscriber } from '@/types/api'

defineProps<{
  subscriber: NotificationSubscriber
}>()

defineEmits<{
  delete: []
  edit: []
}>()

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email':
      return Mail
    case 'slack':
      return MessageSquare
    case 'sms':
      return Smartphone
    default:
      return MessageSquare
  }
}

const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'email':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'slack':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'sms':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
  >
    <!-- Subscriber Info -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-1">
          <User class="w-5 h-5 text-gray-500" />
          <h3 class="text-lg font-bold text-gray-900 truncate">
            {{ subscriber.first_name }} {{ subscriber.last_name }}
          </h3>
        </div>
        <p class="text-xs text-gray-500 mb-1">@{{ subscriber.user_name }}</p>
        <p class="text-sm text-gray-600 truncate">
          {{ subscriber.delivery_address_email || 'No email provided' }}
        </p>
      </div>
      <div
        :class="[
          'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
          subscriber.is_active
            ? 'text-green-600 bg-green-50 border-green-200'
            : 'text-red-600 bg-red-50 border-red-200',
        ]"
      >
        <component :is="subscriber.is_active ? CheckCircle2 : XCircle" class="w-3.5 h-3.5" />
        <span>{{ subscriber.is_active ? 'Active' : 'Inactive' }}</span>
      </div>
    </div>

    <!-- Channel Info -->
    <div class="mb-4">
      <div
        :class="[
          'inline-flex items-center space-x-2 px-3 py-2 rounded-lg border',
          getChannelColor(subscriber.notification_channel),
        ]"
      >
        <component :is="getChannelIcon(subscriber.notification_channel)" class="w-4 h-4" />
        <span class="text-sm font-medium capitalize">{{ subscriber.notification_channel }}</span>
      </div>
    </div>

    <!-- Subscription Date -->
    <div class="text-xs text-gray-500 mb-4">
      Subscribed: {{ new Date(subscriber.subscribed_at).toLocaleDateString() }}
    </div>

    <!-- Actions -->
    <div class="flex space-x-2 pt-4 border-t border-gray-100">
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
