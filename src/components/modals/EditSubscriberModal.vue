<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UpdateNotificationSubscriberRequest, NotificationSubscriber } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  subscriber: NotificationSubscriber | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: UpdateNotificationSubscriberRequest]
}>()

const editForm = ref<UpdateNotificationSubscriberRequest>({
  delivery_address_email: null,
  slack_webhook_url: null,
  notification_channel: null,
  is_active: null,
})

// Populate form when subscriber changes
watch(
  () => props.subscriber,
  (newSubscriber) => {
    if (newSubscriber) {
      editForm.value = {
        delivery_address_email: newSubscriber.delivery_address_email,
        slack_webhook_url: newSubscriber.slack_webhook_url,
        notification_channel: newSubscriber.notification_channel,
        is_active: newSubscriber.is_active,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  // Only send fields that have changed
  const updatedFields: UpdateNotificationSubscriberRequest = {}

  if (editForm.value.delivery_address_email !== props.subscriber?.delivery_address_email) {
    updatedFields.delivery_address_email = editForm.value.delivery_address_email
  }
  if (editForm.value.slack_webhook_url !== props.subscriber?.slack_webhook_url) {
    updatedFields.slack_webhook_url = editForm.value.slack_webhook_url
  }
  if (editForm.value.notification_channel !== props.subscriber?.notification_channel) {
    updatedFields.notification_channel = editForm.value.notification_channel
  }
  if (editForm.value.is_active !== props.subscriber?.is_active) {
    updatedFields.is_active = editForm.value.is_active
  }

  emit('submit', updatedFields)
}

const handleClose = () => {
  editForm.value = {
    delivery_address_email: null,
    slack_webhook_url: null,
    notification_channel: null,
    is_active: null,
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="show && subscriber"
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background-color: rgba(0, 0, 0, 0.3)"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Edit Notification Subscriber</h2>

      <!-- Display subscriber info (read-only) -->
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600">
          <span class="font-medium">Subscriber:</span>
          {{ subscriber.first_name }} {{ subscriber.last_name }} (@{{ subscriber.user_name }})
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Notification Channel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Notification Channel
          </label>
          <select
            v-model="editForm.notification_channel"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="email">Email</option>
            <option value="slack">Slack</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <!-- Email Address -->
        <div v-if="editForm.notification_channel === 'email'">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input
            v-model="editForm.delivery_address_email"
            type="email"
            placeholder="user@example.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Slack Webhook URL -->
        <div v-if="editForm.notification_channel === 'slack'">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Slack Webhook URL
          </label>
          <input
            v-model="editForm.slack_webhook_url"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Active Status -->
        <div>
          <label class="flex items-center space-x-3">
            <input
              v-model="editForm.is_active"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">Active Subscription</span>
          </label>
          <p class="mt-1 text-xs text-gray-500 ml-7">
            Inactive subscriptions will not receive notifications
          </p>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3 pt-2">
          <button
            type="button"
            @click="handleClose"
            :disabled="loading"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Updating...' : 'Update Subscriber' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
