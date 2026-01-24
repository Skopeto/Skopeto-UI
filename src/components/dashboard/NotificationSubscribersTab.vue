<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Bell } from 'lucide-vue-next'
import SubscriberCard from './SubscriberCard.vue'
import ConfirmDialog from '../modals/ConfirmDialog.vue'
import RegisterSubscriberModal from '../modals/RegisterSubscriberModal.vue'
import EditSubscriberModal from '../modals/EditSubscriberModal.vue'
import EmptyState from '../shared/EmptyState.vue'
import type {
  NotificationSubscriber,
  RegisterNotificationSubscriberRequest,
  UpdateNotificationSubscriberRequest,
  User,
} from '@/types/api'
import { notificationsApi } from '@/api/notifications'
import { usersApi } from '@/api/users'

// State
const subscribers = ref<NotificationSubscriber[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

// Modals
const showRegisterModal = ref(false)
const registerError = ref('')
const registerLoading = ref(false)

const showEditModal = ref(false)
const editError = ref('')
const editLoading = ref(false)
const subscriberToEdit = ref<NotificationSubscriber | null>(null)

const showDeleteConfirm = ref(false)
const subscriberToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

// Get current user ID from token
const getCurrentUserId = (): number => {
  const token = localStorage.getItem('access_token')
  if (!token) return 0
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return 0
    const payload = JSON.parse(atob(parts[1]))
    return payload.user_id || 0
  } catch {
    return 0
  }
}

const currentUserId = ref(getCurrentUserId())

// Fetch subscribers
const fetchSubscribers = async () => {
  loading.value = true
  error.value = ''
  try {
    subscribers.value = await notificationsApi.getSubscribers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { error?: string; detail?: string; message?: string } } }
    if (axiosError.response?.status === 403) {
      const data = axiosError.response?.data
      error.value = data?.error || data?.detail || data?.message || 'Access denied'
    } else {
      error.value = 'Failed to fetch subscribers'
    }
  } finally {
    loading.value = false
  }
}

// Fetch users (needed for registration modal)
const fetchUsers = async () => {
  try {
    users.value = await usersApi.getAll()
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { error?: string; detail?: string; message?: string } } }
    if (axiosError.response?.status === 403) {
      const data = axiosError.response?.data
      error.value = data?.error || data?.detail || data?.message || 'Access denied'
    } else {
      error.value = 'Failed to fetch users'
    }
  }
}

// Register subscriber
const handleRegisterSubscriber = async (formData: RegisterNotificationSubscriberRequest) => {
  registerError.value = ''
  registerLoading.value = true

  try {
    await notificationsApi.registerSubscriber(formData)
    showRegisterModal.value = false
    registerError.value = ''
    await fetchSubscribers()
  } catch (err: any) {
    registerError.value = err.response?.data?.error || 'Failed to register subscriber'
  } finally {
    registerLoading.value = false
  }
}

// Edit subscriber
const handleEditSubscriber = (subscriberId: number) => {
  const subscriber = subscribers.value.find((s) => s.id === subscriberId)
  if (subscriber) {
    subscriberToEdit.value = subscriber
    editError.value = ''
    showEditModal.value = true
  }
}

const handleUpdateSubscriber = async (formData: UpdateNotificationSubscriberRequest) => {
  if (!subscriberToEdit.value) return

  editError.value = ''
  editLoading.value = true

  try {
    await notificationsApi.updateSubscriber(subscriberToEdit.value.id, formData)
    showEditModal.value = false
    editError.value = ''
    subscriberToEdit.value = null
    await fetchSubscribers()
  } catch (err: any) {
    editError.value = err.response?.data?.error || 'Failed to update subscriber'
  } finally {
    editLoading.value = false
  }
}

// Delete subscriber
const handleDeleteClick = (subscriberId: number) => {
  subscriberToDelete.value = subscriberId
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = async () => {
  if (subscriberToDelete.value === null) return

  deleteLoading.value = true
  try {
    await notificationsApi.deleteSubscriber(subscriberToDelete.value)
    showDeleteConfirm.value = false
    subscriberToDelete.value = null
    await fetchSubscribers()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete subscriber'
  } finally {
    deleteLoading.value = false
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  subscriberToDelete.value = null
  deleteLoading.value = false
}

// Initialize
onMounted(async () => {
  await Promise.all([fetchSubscribers(), fetchUsers()])
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Notification Subscribers</h2>
        <p class="text-sm text-gray-600 mt-1">Manage users who receive notifications</p>
      </div>
      <button
        @click="showRegisterModal = true"
        class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Plus class="w-5 h-5" />
        <span class="font-medium">Add Subscriber</span>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading subscribers...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="subscribers.length === 0 && !error">
      <EmptyState
        :icon="Bell"
        title="No notification subscribers"
        description="Get started by adding your first notification subscriber"
        action-text="Add Subscriber"
        @action="showRegisterModal = true"
      />
    </div>

    <!-- Subscribers List -->
    <div v-else class="space-y-3">
      <SubscriberCard
        v-for="subscriber in subscribers"
        :key="subscriber.id"
        :subscriber="subscriber"
        @delete="handleDeleteClick(subscriber.id)"
        @edit="handleEditSubscriber(subscriber.id)"
      />
    </div>

    <!-- Register Subscriber Modal -->
    <RegisterSubscriberModal
      :show="showRegisterModal"
      :loading="registerLoading"
      :error="registerError"
      :users="users"
      :current-user-id="currentUserId"
      @close="showRegisterModal = false"
      @submit="handleRegisterSubscriber"
    />

    <!-- Edit Subscriber Modal -->
    <EditSubscriberModal
      :show="showEditModal"
      :loading="editLoading"
      :error="editError"
      :subscriber="subscriberToEdit"
      @close="showEditModal = false"
      @submit="handleUpdateSubscriber"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="Delete Subscriber"
      message="Are you sure you want to delete this subscriber? This action cannot be undone."
      confirm-text="Delete"
      confirm-color="red"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
