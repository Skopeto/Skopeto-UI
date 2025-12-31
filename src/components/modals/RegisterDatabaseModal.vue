<script setup lang="ts">
import { ref } from 'vue'
import type { DatabaseRegisterRequest } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  serverId: number
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: DatabaseRegisterRequest]
}>()

const registerForm = ref<DatabaseRegisterRequest>({
  server_id: props.serverId,
  name: '',
  db_type: 'postgresql',
  host: '',
  port: 5432,
  database_name: '',
  service_name: '',
  username: '',
  password: '',
})

const handleSubmit = () => {
  registerForm.value.server_id = props.serverId
  emit('submit', { ...registerForm.value })
}

const handleClose = () => {
  // Reset form
  registerForm.value = {
    server_id: props.serverId,
    name: '',
    db_type: 'postgresql',
    host: '',
    port: 5432,
    database_name: '',
    service_name: '',
    username: '',
    password: '',
  }
  emit('close')
}

const handleDatabaseTypeChange = () => {
  // Auto-update default port based on database type
  switch (registerForm.value.db_type) {
    case 'postgresql':
    case 'postgres':
      registerForm.value.port = 5432
      break
    case 'mysql':
    case 'mariadb':
      registerForm.value.port = 3306
      break
    case 'mongodb':
      registerForm.value.port = 27017
      break
    case 'redis':
      registerForm.value.port = 6379
      break
    case 'sqlite':
      registerForm.value.port = 0
      break
    case 'oracle':
      registerForm.value.port = 1521
      break
    default:
      registerForm.value.port = 5432
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
      <h2 class="text-xl font-bold text-gray-900 mb-4">Register New Database</h2>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <!-- Display Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Display Name
            <span class="text-xs text-gray-500 font-normal ml-1">(friendly name for this connection)</span>
          </label>
          <input
            v-model="registerForm.name"
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
            v-model="registerForm.db_type"
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
            v-model="registerForm.host"
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
            v-model.number="registerForm.port"
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
            v-model="registerForm.database_name"
            type="text"
            placeholder="e.g., myapp_db, production_db"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Service Name (Oracle only) -->
        <div v-if="registerForm.db_type === 'oracle'">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Service Name
            <span class="text-xs text-gray-500 font-normal ml-1">(for Oracle databases)</span>
          </label>
          <input
            v-model="registerForm.service_name"
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
            v-model="registerForm.username"
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
          </label>
          <input
            v-model="registerForm.password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Enter database password"
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
            class="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Registering...</span>
            <span v-else>Register Database</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
