<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UpdateServerCheckRequest, ServerCheck } from '@/types/api'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  check: ServerCheck | null
}>()

const emit = defineEmits<{
  close: []
  submit: [formData: UpdateServerCheckRequest]
}>()

const editForm = ref<UpdateServerCheckRequest>({
  name: undefined,
  command: undefined,
  threshold: undefined,
  operator: undefined,
  unit: undefined,
})

const operators = [
  { value: '>', label: '> (greater than)' },
  { value: '<', label: '< (less than)' },
  { value: '>=', label: '>= (greater or equal)' },
  { value: '<=', label: '<= (less or equal)' },
  { value: '==', label: '== (equal)' },
  { value: '!=', label: '!= (not equal)' },
]

// Populate form when check changes
watch(
  () => props.check,
  (newCheck) => {
    if (newCheck) {
      editForm.value = {
        name: newCheck.name,
        command: newCheck.command,
        threshold: newCheck.threshold,
        operator: newCheck.operator,
        unit: newCheck.unit,
      }
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  // Only send fields that have changed
  const updatedFields: UpdateServerCheckRequest = {}

  if (editForm.value.name !== props.check?.name) {
    updatedFields.name = editForm.value.name
  }
  if (editForm.value.command !== props.check?.command) {
    updatedFields.command = editForm.value.command
  }
  if (editForm.value.threshold !== props.check?.threshold) {
    updatedFields.threshold = editForm.value.threshold
  }
  if (editForm.value.operator !== props.check?.operator) {
    updatedFields.operator = editForm.value.operator
  }
  if (editForm.value.unit !== props.check?.unit) {
    updatedFields.unit = editForm.value.unit
  }

  emit('submit', updatedFields)
}

const handleClose = () => {
  editForm.value = {
    name: undefined,
    command: undefined,
    threshold: undefined,
    operator: undefined,
    unit: undefined,
  }
  emit('close')
}
</script>

<template>
  <div
    v-if="show && check"
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background-color: rgba(0, 0, 0, 0.3)"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Edit Server Check</h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Name
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="editForm.name"
            type="text"
            required
            placeholder="e.g., CPU Usage Check"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Command -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Command
            <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="editForm.command"
            required
            rows="3"
            placeholder="e.g., top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">
            The command will be executed via SSH on the server. Output should be numeric.
          </p>
        </div>

        <!-- Operator -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Operator
            <span class="text-red-500">*</span>
          </label>
          <select
            v-model="editForm.operator"
            required
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option v-for="op in operators" :key="op.value" :value="op.value">
              {{ op.label }}
            </option>
          </select>
        </div>

        <!-- Threshold and Unit -->
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Threshold
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="editForm.threshold"
              type="number"
              required
              step="any"
              placeholder="e.g., 80"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Unit
            </label>
            <input
              v-model="editForm.unit"
              type="text"
              placeholder="e.g., %"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p class="text-xs text-gray-500">
          Alert triggers when: command output {{ editForm.operator }} {{ editForm.threshold }}{{ editForm.unit }}
        </p>

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
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Updating...' : 'Update Check' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
