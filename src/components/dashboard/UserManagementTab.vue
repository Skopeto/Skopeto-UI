<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Mail, User as UserIcon, Shield, ShieldCheck, Edit } from 'lucide-vue-next'
import EmptyState from '../shared/EmptyState.vue'
import EditUserModal from '../modals/EditUserModal.vue'
import type { User, UpdateUserRequest } from '@/types/api'
import { usersApi } from '@/api/users'

// State
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

// Edit modal state
const showEditModal = ref(false)
const editError = ref('')
const editLoading = ref(false)
const userToEdit = ref<User | null>(null)

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  error.value = ''
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
  } finally {
    loading.value = false
  }
}

// Edit user
const handleEditUser = (user: User) => {
  userToEdit.value = user
  editError.value = ''
  showEditModal.value = true
}

const handleManageUser = async (formData: UpdateUserRequest) => {
  if (!userToEdit.value) return

  editError.value = ''
  editLoading.value = true

  try {
    await usersApi.manage(userToEdit.value.id, formData)
    showEditModal.value = false
    editError.value = ''
    userToEdit.value = null
    await fetchUsers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: string } } }
    editError.value = axiosError.response?.data?.error || 'Failed to update user'
  } finally {
    editLoading.value = false
  }
}

const handleCloseModal = () => {
  showEditModal.value = false
  userToEdit.value = null
  editError.value = ''
}

// Initialize
onMounted(async () => {
  await fetchUsers()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">User Management</h2>
        <p class="text-sm text-gray-600 mt-1">View and manage system users</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading users...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0 && !error">
      <EmptyState
        :icon="Users"
        title="No users found"
        description="No users have been registered in the system yet"
      />
    </div>

    <!-- Users List -->
    <div v-else class="space-y-3">
      <div
        v-for="user in users"
        :key="user.id"
        class="bg-white rounded-xl shadow-md border border-gray-100 px-5 py-3 hover:shadow-lg transition-all duration-200"
      >
        <div class="flex items-center justify-between">
          <!-- Left: User Info -->
          <div class="flex items-center space-x-3 min-w-0">
            <div
              :class="[
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                user.is_active
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              ]"
            >
              <UserIcon class="w-5 h-5 text-white" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-semibold text-gray-900 truncate">
                  {{ user.first_name }} {{ user.last_name }}
                </h3>
                <span class="text-xs text-gray-400">@{{ user.user_name }}</span>
              </div>
              <div class="flex items-center text-xs text-gray-500">
                <Mail class="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span class="truncate">{{ user.email }}</span>
              </div>
            </div>
          </div>

          <!-- Middle: Role & Status -->
          <div class="flex items-center space-x-3 flex-shrink-0">
            <!-- Role -->
            <span
              v-if="user.roles && user.roles.length > 0"
              :class="[
                'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
                user.roles[0] === 'superadmin'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : user.roles[0] === 'admin'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              ]"
            >
              <component
                :is="user.roles[0] === 'superadmin' ? ShieldCheck : Shield"
                class="w-3.5 h-3.5 mr-1"
              />
              {{ user.roles[0] }}
            </span>
            <!-- Status -->
            <span
              :class="[
                'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border',
                user.is_active
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              ]"
            >
              {{ user.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
            <button
              @click="handleEditUser(user)"
              class="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Edit class="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <EditUserModal
      :show="showEditModal"
      :loading="editLoading"
      :error="editError"
      :user="userToEdit"
      @close="handleCloseModal"
      @submit="handleManageUser"
    />
  </div>
</template>
