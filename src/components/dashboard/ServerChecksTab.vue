<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Terminal } from 'lucide-vue-next'
import ServerCheckCard from './ServerCheckCard.vue'
import ConfirmDialog from '../modals/ConfirmDialog.vue'
import RegisterServerCheckModal from '../modals/RegisterServerCheckModal.vue'
import EditServerCheckModal from '../modals/EditServerCheckModal.vue'
import EmptyState from '../shared/EmptyState.vue'
import type {
  ServerCheck,
  RegisterServerCheckRequest,
  UpdateServerCheckRequest,
} from '@/types/api'
import { serverChecksApi } from '@/api/serverChecks'

// State
const checks = ref<ServerCheck[]>([])
const loading = ref(false)
const error = ref('')

// Modals
const showRegisterModal = ref(false)
const registerError = ref('')
const registerLoading = ref(false)

const showEditModal = ref(false)
const editError = ref('')
const editLoading = ref(false)
const checkToEdit = ref<ServerCheck | null>(null)

const showDeleteConfirm = ref(false)
const checkToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

// Fetch checks
const fetchChecks = async () => {
  loading.value = true
  error.value = ''
  try {
    checks.value = await serverChecksApi.getAll()
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { error?: string; detail?: string; message?: string } } }
    if (axiosError.response?.status === 403) {
      const data = axiosError.response?.data
      error.value = data?.error || data?.detail || data?.message || 'Access denied'
    } else {
      error.value = 'Failed to fetch server checks'
    }
  } finally {
    loading.value = false
  }
}

// Register check
const handleRegisterCheck = async (formData: RegisterServerCheckRequest) => {
  registerError.value = ''
  registerLoading.value = true

  try {
    await serverChecksApi.register(formData)
    showRegisterModal.value = false
    registerError.value = ''
    await fetchChecks()
  } catch (err: any) {
    registerError.value = err.response?.data?.error || 'Failed to register server check'
  } finally {
    registerLoading.value = false
  }
}

// Edit check
const handleEditCheck = (healthCheckId: number) => {
  const check = checks.value.find((c) => c.health_check_id === healthCheckId)
  if (check) {
    checkToEdit.value = check
    editError.value = ''
    showEditModal.value = true
  }
}

const handleUpdateCheck = async (formData: UpdateServerCheckRequest) => {
  if (!checkToEdit.value) return

  editError.value = ''
  editLoading.value = true

  try {
    await serverChecksApi.update(checkToEdit.value.health_check_id, formData)
    showEditModal.value = false
    editError.value = ''
    checkToEdit.value = null
    await fetchChecks()
  } catch (err: any) {
    editError.value = err.response?.data?.error || 'Failed to update server check'
  } finally {
    editLoading.value = false
  }
}

// Delete check
const handleDeleteClick = (checkId: number) => {
  checkToDelete.value = checkId
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = async () => {
  if (checkToDelete.value === null) return

  deleteLoading.value = true
  try {
    await serverChecksApi.delete(checkToDelete.value)
    showDeleteConfirm.value = false
    checkToDelete.value = null
    await fetchChecks()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete server check'
  } finally {
    deleteLoading.value = false
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  checkToDelete.value = null
  deleteLoading.value = false
}

// Initialize
onMounted(async () => {
  await fetchChecks()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Server Commands</h2>
        <p class="text-sm text-gray-600 mt-1">Manage global health check commands for SSH monitoring</p>
      </div>
      <button
        @click="showRegisterModal = true"
        class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Plus class="w-5 h-5" />
        <span class="font-medium">Add Check</span>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading server checks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="checks.length === 0 && !error">
      <EmptyState
        :icon="Terminal"
        title="No server checks configured"
        description="Get started by adding your first server check command"
        action-text="Add Check"
        @action="showRegisterModal = true"
      />
    </div>

    <!-- Checks List -->
    <div v-else class="space-y-3">
      <ServerCheckCard
        v-for="check in checks"
        :key="check.health_check_id"
        :check="check"
        @delete="handleDeleteClick(check.health_check_id)"
        @edit="handleEditCheck(check.health_check_id)"
      />
    </div>

    <!-- Register Check Modal -->
    <RegisterServerCheckModal
      :show="showRegisterModal"
      :loading="registerLoading"
      :error="registerError"
      @close="showRegisterModal = false"
      @submit="handleRegisterCheck"
    />

    <!-- Edit Check Modal -->
    <EditServerCheckModal
      :show="showEditModal"
      :loading="editLoading"
      :error="editError"
      :check="checkToEdit"
      @close="showEditModal = false"
      @submit="handleUpdateCheck"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="Delete Server Check"
      message="Are you sure you want to delete this server check? This action cannot be undone."
      confirm-text="Delete"
      confirm-color="red"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
