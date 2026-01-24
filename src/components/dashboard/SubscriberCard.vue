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
    class="bg-white rounded-xl shadow-md border border-gray-100 px-5 py-3 hover:shadow-lg transition-all duration-200"
  >
    <div class="flex items-center justify-between">
      <!-- Left: User Info -->
      <div class="flex items-center space-x-3 min-w-0">
        <User class="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div class="min-w-0">
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-semibold text-gray-900 truncate">
              {{ subscriber.first_name }} {{ subscriber.last_name }}
            </h3>
            <span class="text-xs text-gray-400">@{{ subscriber.user_name }}</span>
          </div>
          <p class="text-xs text-gray-500 truncate">
            {{ subscriber.delivery_address_email || 'No email provided' }}
          </p>
        </div>
      </div>

      <!-- Middle: Channel & Status -->
      <div class="flex items-center space-x-3 flex-shrink-0">
        <div
          :class="[
            'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
            getChannelColor(subscriber.notification_channel),
          ]"
        >
          <component :is="getChannelIcon(subscriber.notification_channel)" class="w-3.5 h-3.5" />
          <span class="capitalize">{{ subscriber.notification_channel }}</span>
        </div>
        <div
          :class="[
            'inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium',
            subscriber.is_active
              ? 'text-green-600 bg-green-50 border-green-200'
              : 'text-red-600 bg-red-50 border-red-200',
          ]"
        >
          <component :is="subscriber.is_active ? CheckCircle2 : XCircle" class="w-3 h-3" />
          <span>{{ subscriber.is_active ? 'Active' : 'Inactive' }}</span>
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
