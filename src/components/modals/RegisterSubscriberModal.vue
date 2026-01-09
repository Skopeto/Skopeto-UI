<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RegisterNotificationSubscriberRequest, User } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  users: User[]
  currentUserId: number
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: RegisterNotificationSubscriberRequest]
}>()

const registerForm = ref<RegisterNotificationSubscriberRequest>({
  user_id: 0,
  user_name: '',
  first_name: '',
  last_name: '',
  delivery_address_email: null,
  slack_webhook_url: null,
  notification_channel: 'email',
})

// Update user info when user_id changes
watch(
  () => registerForm.value.user_id,
  (newUserId) => {
    const selectedUser = props.users.find((u) => u.id === newUserId)
    if (selectedUser) {
      registerForm.value.user_name = selectedUser.user_name
      registerForm.value.first_name = selectedUser.first_name
      registerForm.value.last_name = selectedUser.last_name
      // Pre-fill email if channel is email and user has email
      if (registerForm.value.notification_channel === 'email' && selectedUser.email) {
        registerForm.value.delivery_address_email = selectedUser.email
      }
    }
  },
)

// Update required fields when channel changes
watch(
  () => registerForm.value.notification_channel,
  (newChannel) => {
    const selectedUser = props.users.find((u) => u.id === registerForm.value.user_id)
    // Reset fields
    registerForm.value.delivery_address_email = null
    registerForm.value.slack_webhook_url = null

    // Pre-fill email if channel is email
    if (newChannel === 'email' && selectedUser?.email) {
      registerForm.value.delivery_address_email = selectedUser.email
    }
  },
)

const isEmailRequired = computed(() => registerForm.value.notification_channel === 'email')
const isSlackRequired = computed(() => registerForm.value.notification_channel === 'slack')

const handleSubmit = () => {
  emit('submit', { ...registerForm.value })
}

const handleClose = () => {
  // Reset form
  registerForm.value = {
    user_id: 0,
    user_name: '',
    first_name: '',
    last_name: '',
    delivery_address_email: null,
    slack_webhook_url: null,
    notification_channel: 'email',
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background-color: rgba(0, 0, 0, 0.3)"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Register Notification Subscriber</h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- User Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Select User</label>
          <select
            v-model.number="registerForm.user_id"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="0" disabled>Select a user...</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.first_name }} {{ user.last_name }} (@{{ user.user_name }})
            </option>
          </select>
        </div>

        <!-- Notification Channel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Notification Channel
          </label>
          <select
            v-model="registerForm.notification_channel"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="email">Email</option>
            <option value="slack">Slack</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <!-- Email Address (for email channel) -->
        <div v-if="isEmailRequired">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="registerForm.delivery_address_email"
            type="email"
            :required="isEmailRequired"
            placeholder="user@example.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Slack Webhook URL (for slack channel) -->
        <div v-if="isSlackRequired">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Slack Webhook URL
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="registerForm.slack_webhook_url"
            type="url"
            :required="isSlackRequired"
            placeholder="https://hooks.slack.com/services/..."
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="mt-1 text-xs text-gray-500">
            Get your webhook URL from Slack's Incoming Webhooks app
          </p>
        </div>

        <!-- SMS Note -->
        <div
          v-if="registerForm.notification_channel === 'sms'"
          class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <p class="text-sm text-yellow-800">
            SMS notifications require additional configuration on the server side.
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
            :disabled="loading || registerForm.user_id === 0"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Registering...' : 'Register Subscriber' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
