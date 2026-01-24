<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User as UserIcon, Mail, Shield, Save, Lock } from 'lucide-vue-next'
import type { User, UpdateUserRequest } from '@/types/api'
import { usersApi } from '@/api/users'

// State
const user = ref<User | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')

const editForm = ref({
  first_name: '',
  last_name: '',
  user_name: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
})

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

// Fetch current user
const fetchUser = async () => {
  loading.value = true
  error.value = ''
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'User not authenticated'
      return
    }
    user.value = await usersApi.getById(userId)
    editForm.value = {
      first_name: user.value.first_name,
      last_name: user.value.last_name,
      user_name: user.value.user_name,
      email: user.value.email,
      current_password: '',
      new_password: '',
      confirm_password: '',
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: string } } }
    error.value = axiosError.response?.data?.error || 'Failed to fetch user data'
  } finally {
    loading.value = false
  }
}

// Save changes
const handleSave = async () => {
  if (!user.value) return

  saving.value = true
  error.value = ''
  success.value = ''

  // Validate password if changing
  if (editForm.value.new_password) {
    if (!editForm.value.current_password) {
      error.value = 'Current password is required to change password'
      saving.value = false
      return
    }
    if (editForm.value.new_password !== editForm.value.confirm_password) {
      error.value = 'New passwords do not match'
      saving.value = false
      return
    }
    if (editForm.value.new_password.length < 6) {
      error.value = 'Password must be at least 6 characters'
      saving.value = false
      return
    }
  }

  const updatedFields: UpdateUserRequest = {}

  if (editForm.value.first_name !== user.value.first_name) {
    updatedFields.first_name = editForm.value.first_name
  }
  if (editForm.value.last_name !== user.value.last_name) {
    updatedFields.last_name = editForm.value.last_name
  }
  if (editForm.value.user_name !== user.value.user_name) {
    updatedFields.user_name = editForm.value.user_name
  }
  if (editForm.value.email !== user.value.email) {
    updatedFields.email = editForm.value.email
  }
  if (editForm.value.new_password) {
    updatedFields.current_password = editForm.value.current_password
    updatedFields.new_password = editForm.value.new_password
  }

  if (Object.keys(updatedFields).length === 0) {
    success.value = 'No changes to save'
    saving.value = false
    return
  }

  try {
    await usersApi.update(user.value.id, updatedFields)
    success.value = 'Account updated successfully'
    // Clear password fields after successful save
    editForm.value.current_password = ''
    editForm.value.new_password = ''
    editForm.value.confirm_password = ''
    await fetchUser()
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: string; detail?: string } } }
    error.value = axiosError.response?.data?.error || axiosError.response?.data?.detail || 'Failed to update account'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p class="mt-4 text-gray-600">Loading account...</p>
    </div>

    <div v-else-if="user" class="max-w-2xl">
      <!-- Profile Header -->
      <div class="flex items-center space-x-4 mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
          <UserIcon class="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">{{ user.first_name }} {{ user.last_name }}</h3>
          <p class="text-gray-500">@{{ user.user_name }}</p>
          <div v-if="user.roles && user.roles.length > 0" class="mt-1 flex flex-wrap gap-1.5">
            <span
              v-for="role in user.roles"
              :key="role"
              :class="[
                'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                role === 'superadmin'
                  ? 'bg-red-100 text-red-700'
                  : role === 'admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
              ]"
            >
              <Shield class="w-3 h-3 mr-1" />
              {{ role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
        <p class="text-sm text-green-800">{{ success }}</p>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="handleSave" class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            <input
              v-model="editForm.first_name"
              type="text"
              required
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            <input
              v-model="editForm.last_name"
              type="text"
              required
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input
            v-model="editForm.user_name"
            type="text"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="editForm.email"
              type="email"
              required
              class="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Password Section -->
        <div class="pt-4 border-t border-gray-200">
          <h4 class="text-sm font-semibold text-gray-900 mb-4">Change Password (optional)</h4>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  v-model="editForm.current_password"
                  type="password"
                  class="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Required only if changing password"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div class="relative">
                  <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    v-model="editForm.new_password"
                    type="password"
                    class="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div class="relative">
                  <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    v-model="editForm.confirm_password"
                    type="password"
                    class="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4">
          <button
            type="submit"
            :disabled="saving"
            class="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save class="w-4 h-4" />
            <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
