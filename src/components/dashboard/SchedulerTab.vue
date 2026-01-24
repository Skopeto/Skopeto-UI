<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Clock, Save, AlertCircle } from 'lucide-vue-next'
import { schedulerApi, type SchedulerTimer } from '@/api/scheduler'

// State
const timer = ref<SchedulerTimer | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')

// Form state
const intervalMinutes = ref(5)

// Preset options for quick selection
const presetOptions = [
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
]

// Check if current value matches a preset
const isPresetSelected = computed(() => {
  return presetOptions.some(opt => opt.value === intervalMinutes.value)
})

// Fetch current timer settings
const fetchTimer = async () => {
  loading.value = true
  error.value = ''
  fetchFailed.value = false
  try {
    timer.value = await schedulerApi.getTimer()
    intervalMinutes.value = timer.value.interval_minutes
  } catch (err: unknown) {
    fetchFailed.value = true
    // Don't show error - just means no timer exists yet, user can create one
  } finally {
    loading.value = false
  }
}

// Update timer settings
const handleSave = async () => {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await schedulerApi.updateTimer({ interval_minutes: intervalMinutes.value })
    timer.value = result
    fetchFailed.value = false // Timer now exists
    success.value = result.message || 'Scheduler interval updated successfully'

    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { detail?: string } } }
    error.value = axiosError.response?.data?.detail || 'Failed to update scheduler settings'
  } finally {
    saving.value = false
  }
}

// Select a preset
const selectPreset = (value: number) => {
  intervalMinutes.value = value
}

// Format display time
const formatInterval = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  const hours = minutes / 60
  if (hours === Math.floor(hours)) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  return `${minutes} minutes`
}

// Track if initial fetch failed (no timer exists yet)
const fetchFailed = ref(false)

// Check if value has changed from saved or if no timer exists yet
const hasChanges = computed(() => {
  // If fetch failed, allow saving to create a new timer
  if (fetchFailed.value) return true
  // If timer exists, check if value changed
  return timer.value && intervalMinutes.value !== timer.value.interval_minutes
})

onMounted(() => {
  fetchTimer()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Scheduler</h2>
      <p class="text-sm text-gray-600 mt-1">Configure your monitoring schedule</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start space-x-3">
      <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
      <p class="text-sm text-green-800">{{ success }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading scheduler...</p>
    </div>

    <!-- Settings Content -->
    <div v-else class="max-w-2xl">
      <!-- Scheduler Interval Section -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Scheduler Interval</h3>
              <p class="text-sm text-gray-600">How often the system checks your servers</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Current Value Display -->
          <div :class="[fetchFailed ? 'bg-amber-50' : 'bg-blue-50', 'rounded-lg p-4']">
            <p :class="[fetchFailed ? 'text-amber-700' : 'text-blue-700', 'text-sm']">
              <template v-if="fetchFailed">
                No scheduler configured yet. Select an interval below to create one.
              </template>
              <template v-else>
                Current interval: <span class="font-semibold">{{ formatInterval(timer?.interval_minutes || 5) }}</span>
              </template>
            </p>
          </div>

          <!-- Preset Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Quick Select</label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                v-for="option in presetOptions"
                :key="option.value"
                @click="selectPreset(option.value)"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
                  intervalMinutes === option.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Custom Input -->
          <div>
            <label for="custom-interval" class="block text-sm font-medium text-gray-700 mb-2">
              Or enter custom value (1-1440 minutes)
            </label>
            <div class="flex items-center space-x-3">
              <input
                id="custom-interval"
                v-model.number="intervalMinutes"
                type="number"
                min="1"
                max="1440"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <span class="text-gray-600">minutes</span>
              <span v-if="!isPresetSelected" class="text-sm text-blue-600 font-medium">
                ({{ formatInterval(intervalMinutes) }})
              </span>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p class="text-sm text-amber-800">
              <strong>Note:</strong> Shorter intervals provide more real-time monitoring but may increase server load.
              For most use cases, 5-15 minutes is recommended.
            </p>
          </div>

          <!-- Save Button -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <p v-if="fetchFailed" class="text-sm text-amber-600">
              No scheduler set - save to create one
            </p>
            <p v-else-if="hasChanges" class="text-sm text-amber-600">
              You have unsaved changes
            </p>
            <p v-else class="text-sm text-gray-500">
              Scheduler is up to date
            </p>
            <button
              @click="handleSave"
              :disabled="saving || !hasChanges"
              :class="[
                'flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200',
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
            >
              <Save v-if="!saving" class="w-5 h-5" />
              <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
