<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ServerUpdateRequest, Server } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  server: Server | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: ServerUpdateRequest]
}>()

const editForm = ref<ServerUpdateRequest>({
  name: '',
  password: '',
  ip_address: '',
  port: 22,
  status: undefined,
})

// Watch for server prop changes and modal opening to pre-fill the form
watch(
  [() => props.server, () => props.show],
  ([newServer, show]) => {
    if (newServer && show) {
      editForm.value = {
        name: newServer.user_name || '',
        password: '', // Don't pre-fill password for security
        ip_address: newServer.ip_address || '',
        port: newServer.port || 22,
        status: newServer.status || undefined,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  // Only send fields that have changed (partial update via PATCH)
  const updateData: ServerUpdateRequest = {}

  if (editForm.value.name && editForm.value.name !== props.server?.user_name) {
    updateData.name = editForm.value.name
  }
  if (editForm.value.password) {
    updateData.password = editForm.value.password
  }
  if (editForm.value.ip_address && editForm.value.ip_address !== props.server?.ip_address) {
    updateData.ip_address = editForm.value.ip_address
  }
  if (editForm.value.port && editForm.value.port !== props.server?.port) {
    updateData.port = editForm.value.port
  }
  if (editForm.value.status && editForm.value.status !== props.server?.status) {
    updateData.status = editForm.value.status
  }

  emit('submit', updateData)
}

const handleClose = () => {
  // Reset form
  editForm.value = {
    name: '',
    password: '',
    ip_address: '',
    port: 22,
    status: undefined,
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
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Edit Server</h2>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <!-- SSH Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            SSH Username
            <span class="text-xs text-gray-500 font-normal ml-1">(for server connection)</span>
          </label>
          <input
            v-model="editForm.name"
            type="text"
            required
            placeholder="e.g., root, ubuntu, admin"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Server IP Address -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5"> Server IP Address </label>
          <input
            v-model="editForm.ip_address"
            type="text"
            required
            placeholder="e.g., 192.168.1.100 or example.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- SSH Port -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            SSH Port
            <span class="text-xs text-gray-500 font-normal ml-1">(default: 22)</span>
          </label>
          <input
            v-model.number="editForm.port"
            type="number"
            required
            placeholder="22"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- SSH Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            SSH Password
            <span class="text-xs text-gray-500 font-normal ml-1"
              >(leave blank to keep current)</span
            >
          </label>
          <input
            v-model="editForm.password"
            type="password"
            autocomplete="new-password"
            placeholder="Enter new password (optional)"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Server Status -->
        <!-- <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Server Status
          </label>
          <select
            v-model="editForm.status"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="inactive">Inactive</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div> -->

        <!-- Error Message -->
        <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 p-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3 pt-1">
          <button
            type="button"
            @click="handleClose"
            :disabled="loading"
            class="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Updating...</span>
            <span v-else>Update Server</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
