<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DatabaseUpdateRequest, Database } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  database: Database | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: DatabaseUpdateRequest]
}>()

const editForm = ref<DatabaseUpdateRequest>({
  name: '',
  db_type: '',
  host: '',
  port: undefined,
  database_name: '',
  service_name: '',
  username: '',
  password: '',
})

// Watch for database prop changes and modal opening to pre-fill the form
watch(
  [() => props.database, () => props.show],
  ([newDatabase, show]) => {
    if (newDatabase && show) {
      editForm.value = {
        name: newDatabase.name || '',
        db_type: newDatabase.db_type || '',
        host: newDatabase.host || '',
        port: newDatabase.port || undefined,
        database_name: newDatabase.database_name || '',
        service_name: newDatabase.service_name || '',
        username: newDatabase.username || '',
        password: '', // Don't pre-fill password for security
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  // Only send fields that have changed (partial update via PATCH)
  const updateData: DatabaseUpdateRequest = {}

  if (editForm.value.name && editForm.value.name !== props.database?.name) {
    updateData.name = editForm.value.name
  }
  if (editForm.value.db_type && editForm.value.db_type !== props.database?.db_type) {
    updateData.db_type = editForm.value.db_type
  }
  if (editForm.value.host && editForm.value.host !== props.database?.host) {
    updateData.host = editForm.value.host
  }
  if (editForm.value.port && editForm.value.port !== props.database?.port) {
    updateData.port = editForm.value.port
  }
  if (editForm.value.database_name && editForm.value.database_name !== props.database?.database_name) {
    updateData.database_name = editForm.value.database_name
  }
  if (editForm.value.service_name && editForm.value.service_name !== props.database?.service_name) {
    updateData.service_name = editForm.value.service_name
  }
  if (editForm.value.username && editForm.value.username !== props.database?.username) {
    updateData.username = editForm.value.username
  }
  if (editForm.value.password) {
    updateData.password = editForm.value.password
  }

  emit('submit', updateData)
}

const handleClose = () => {
  // Reset form
  editForm.value = {
    name: '',
    db_type: '',
    host: '',
    port: undefined,
    database_name: '',
    service_name: '',
    username: '',
    password: '',
  }
  emit('close')
}

const handleDatabaseTypeChange = () => {
  // Auto-update default port based on database type
  if (editForm.value.db_type) {
    switch (editForm.value.db_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        editForm.value.port = 5432
        break
      case 'mysql':
      case 'mariadb':
        editForm.value.port = 3306
        break
      case 'mongodb':
        editForm.value.port = 27017
        break
      case 'redis':
        editForm.value.port = 6379
        break
      case 'sqlite':
        editForm.value.port = 0
        break
      case 'oracle':
        editForm.value.port = 1521
        break
    }
  }
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
      <h2 class="text-xl font-bold text-gray-900 mb-4">Edit Database</h2>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <!-- Display Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Display Name
            <span class="text-xs text-gray-500 font-normal ml-1">(friendly name for this connection)</span>
          </label>
          <input
            v-model="editForm.name"
            type="text"
            required
            placeholder="e.g., Production DB, Analytics DB"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Database Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5"> Database Type </label>
          <select
            v-model="editForm.db_type"
            @change="handleDatabaseTypeChange"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="mongodb">MongoDB</option>
            <option value="redis">Redis</option>
            <option value="sqlite">SQLite</option>
            <option value="oracle">Oracle</option>
          </select>
        </div>

        <!-- Host -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Database Host
            <span class="text-xs text-gray-500 font-normal ml-1">(IP or hostname)</span>
          </label>
          <input
            v-model="editForm.host"
            type="text"
            required
            placeholder="e.g., localhost, 192.168.1.100, db.example.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Port -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Port
            <span class="text-xs text-gray-500 font-normal ml-1">(auto-filled based on type)</span>
          </label>
          <input
            v-model.number="editForm.port"
            type="number"
            required
            placeholder="5432"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Database Name (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Database Name
            <span class="text-xs text-gray-500 font-normal ml-1">(optional, for specific database)</span>
          </label>
          <input
            v-model="editForm.database_name"
            type="text"
            placeholder="e.g., myapp_db, production_db"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Service Name (Oracle only) -->
        <div v-if="editForm.db_type === 'oracle'">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Service Name
            <span class="text-xs text-gray-500 font-normal ml-1">(for Oracle databases)</span>
          </label>
          <input
            v-model="editForm.service_name"
            type="text"
            placeholder="e.g., ORCL"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Database Username
          </label>
          <input
            v-model="editForm.username"
            type="text"
            required
            placeholder="e.g., postgres, root, admin"
            autocomplete="username"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Database Password
            <span class="text-xs text-gray-500 font-normal ml-1">(leave blank to keep current)</span>
          </label>
          <input
            v-model="editForm.password"
            type="password"
            autocomplete="new-password"
            placeholder="Enter new password (optional)"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

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
            <span v-else>Update Database</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
