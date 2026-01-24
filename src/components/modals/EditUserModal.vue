<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UpdateUserRequest, User } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  user: User | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: UpdateUserRequest]
}>()

const editForm = ref({
  first_name: '' as string | null,
  last_name: '' as string | null,
  user_name: '' as string | null,
  email: '' as string | null,
  is_active: true as boolean | null,
  role: '' as string,
})

const availableRoles = ['user', 'admin', 'superadmin']

// Populate form when user changes
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      editForm.value = {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        user_name: newUser.user_name,
        email: newUser.email,
        is_active: newUser.is_active ?? true,
        role: newUser.roles?.[0] || 'user',
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  const updatedFields: UpdateUserRequest = {}

  if (editForm.value.first_name !== props.user?.first_name) {
    updatedFields.first_name = editForm.value.first_name
  }
  if (editForm.value.last_name !== props.user?.last_name) {
    updatedFields.last_name = editForm.value.last_name
  }
  if (editForm.value.user_name !== props.user?.user_name) {
    updatedFields.user_name = editForm.value.user_name
  }
  if (editForm.value.email !== props.user?.email) {
    updatedFields.email = editForm.value.email
  }
  if (editForm.value.is_active !== props.user?.is_active) {
    updatedFields.is_active = editForm.value.is_active
  }

  const originalRole = props.user?.roles?.[0] || ''
  if (editForm.value.role !== originalRole) {
    updatedFields.roles = [editForm.value.role]
  }

  emit('submit', updatedFields)
}

const handleClose = () => {
  editForm.value = {
    first_name: null,
    last_name: null,
    user_name: null,
    email: null,
    is_active: null,
    role: '',
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="show && user"
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background-color: rgba(0, 0, 0, 0.3)"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Edit User</h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name Fields -->
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

        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input
            v-model="editForm.user_name"
            type="text"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            v-model="editForm.email"
            type="email"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <span class="text-sm font-medium text-gray-700">Active Account</span>
          </label>
          <p class="mt-1 text-xs text-gray-500 ml-7">
            Inactive accounts cannot log in to the system
          </p>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <div class="space-y-2">
            <label
              v-for="role in availableRoles"
              :key="role"
              class="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                :value="role"
                v-model="editForm.role"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 capitalize">{{ role }}</span>
            </label>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            Select the role for this user
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
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Updating...' : 'Update User' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
