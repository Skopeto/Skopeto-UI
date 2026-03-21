<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Server as ServerIcon } from 'lucide-vue-next'
import ServerCard from './ServerCard.vue'
import ConfirmDialog from '../modals/ConfirmDialog.vue'
import EmptyState from '../shared/EmptyState.vue'
import type { ServerWithHealth } from '@/types/api'

defineProps<{
  servers: ServerWithHealth[]
}>()

const emit = defineEmits<{
  add: []
  delete: [serverId: number]
  edit: [serverId: number]
}>()

const showDeleteConfirm = ref(false)
const serverToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

const handleDeleteClick = (serverId: number) => {
  serverToDelete.value = serverId
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = () => {
  if (serverToDelete.value !== null) {
    deleteLoading.value = true
    emit('delete', serverToDelete.value)
    // Note: Parent component should handle closing the modal and resetting loading state
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  serverToDelete.value = null
  deleteLoading.value = false
}

// Expose method for parent to close dialog after successful delete
defineExpose({
  closeDeleteDialog: () => {
    showDeleteConfirm.value = false
    serverToDelete.value = null
    deleteLoading.value = false
  },
})
</script>

<template>
  <div class="p-6">
    <!-- Header with Add Server Button -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Server Management</h2>
        <p class="text-sm text-gray-600 mt-1">Add, edit, and remove servers</p>
      </div>
      <button
        @click="$emit('add')"
        class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Plus class="w-5 h-5" />
        <span class="font-medium">Add Server</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="servers.length === 0">
      <EmptyState
        :icon="ServerIcon"
        title="No servers registered"
        description="Get started by adding your first server to monitor"
        action-text="Add Server"
        @action="$emit('add')"
      />
    </div>

    <!-- Server Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ServerCard
        v-for="serverData in servers"
        :key="serverData.server?.id"
        :server="serverData.server!"
        :check-results="serverData.check_results"
        :show-health="false"
        @delete="serverData.server?.id && handleDeleteClick(serverData.server.id)"
        @edit="serverData.server?.id && $emit('edit', serverData.server.id)"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="Delete Server"
      message="Are you sure you want to delete this server? This action cannot be undone."
      confirm-text="Delete"
      confirm-color="red"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
