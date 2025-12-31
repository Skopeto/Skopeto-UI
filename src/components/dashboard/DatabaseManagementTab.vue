<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Database as DatabaseIcon, Server as ServerIcon, ChevronDown, ChevronUp } from 'lucide-vue-next'
import DatabaseCard from './DatabaseCard.vue'
import ConfirmDialog from '../modals/ConfirmDialog.vue'
import EmptyState from '../shared/EmptyState.vue'
import type { MonitoringData } from '@/types/api'

defineProps<{
  monitoringData: MonitoringData[]
}>()

const emit = defineEmits<{
  add: [serverId: number]
  delete: [databaseId: number]
  edit: [databaseId: number]
}>()

const showDeleteConfirm = ref(false)
const databaseToDelete = ref<number | null>(null)
const deleteLoading = ref(false)
const expandedServers = ref<Set<number>>(new Set())

const handleDeleteClick = (databaseId: number) => {
  databaseToDelete.value = databaseId
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = () => {
  if (databaseToDelete.value !== null) {
    deleteLoading.value = true
    emit('delete', databaseToDelete.value)
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  databaseToDelete.value = null
  deleteLoading.value = false
}

const toggleServerExpand = (serverId: number) => {
  if (expandedServers.value.has(serverId)) {
    expandedServers.value.delete(serverId)
  } else {
    expandedServers.value.add(serverId)
  }
}

// Expose method for parent to close dialog after successful delete
defineExpose({
  closeDeleteDialog: () => {
    showDeleteConfirm.value = false
    databaseToDelete.value = null
    deleteLoading.value = false
  },
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Database Management</h2>
        <p class="text-sm text-gray-600 mt-1">Manage databases by server</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="monitoringData.length === 0">
      <EmptyState
        :icon="ServerIcon"
        title="No servers registered"
        description="Get started by adding your first server to monitor databases"
      />
    </div>

    <!-- Server List with Databases -->
    <div v-else class="space-y-4">
      <div
        v-for="serverData in monitoringData"
        :key="serverData.server?.id"
        class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <!-- Server Header -->
        <div
          @click="serverData.server?.id && toggleServerExpand(serverData.server.id)"
          class="px-6 py-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center"
              >
                <ServerIcon class="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900">
                  {{ serverData.server?.ip_address }}:{{ serverData.server?.port }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ serverData.databases?.length || 0 }} database(s)
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click.stop="serverData.server?.id && $emit('add', serverData.server.id)"
                class="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <Plus class="w-4 h-4" />
                <span>Add Database</span>
              </button>
              <ChevronDown
                v-if="serverData.server?.id && !expandedServers.has(serverData.server.id)"
                class="w-5 h-5 text-gray-400"
              />
              <ChevronUp
                v-else-if="serverData.server?.id && expandedServers.has(serverData.server.id)"
                class="w-5 h-5 text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Database Cards (Expanded) -->
        <div
          v-if="serverData.server?.id && expandedServers.has(serverData.server.id)"
          class="p-6 bg-gray-50"
        >
          <!-- Empty State for No Databases -->
          <div
            v-if="!serverData.databases || serverData.databases.length === 0"
            class="text-center py-8"
          >
            <DatabaseIcon class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-sm text-gray-600 mb-3">No databases configured for this server</p>
            <button
              @click="serverData.server?.id && $emit('add', serverData.server.id)"
              class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <Plus class="w-4 h-4" />
              <span>Add Database</span>
            </button>
          </div>

          <!-- Database Cards Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DatabaseCard
              v-for="dbData in serverData.databases"
              :key="dbData.database.id"
              :database="dbData.database"
              :health="dbData.database_health"
              :server="serverData.server!"
              @delete="dbData.database.id && handleDeleteClick(dbData.database.id)"
              @edit="dbData.database.id && $emit('edit', dbData.database.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="Delete Database"
      message="Are you sure you want to delete this database? This action cannot be undone."
      confirm-text="Delete"
      confirm-color="red"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
