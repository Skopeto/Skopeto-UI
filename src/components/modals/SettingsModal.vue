<script setup lang="ts">
import { ref } from 'vue'
import { X, User, Users, Bell, Sliders } from 'lucide-vue-next'
import UserManagementTab from '../dashboard/UserManagementTab.vue'
import NotificationSubscribersTab from '../dashboard/NotificationSubscribersTab.vue'
import SchedulerTab from '../dashboard/SchedulerTab.vue'
import AccountTab from '../dashboard/AccountTab.vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const activeSection = ref('account')

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscribers', label: 'Notification Subscribers', icon: Bell },
  { id: 'scheduler', label: 'Scheduler', icon: Sliders },
]

const handleClose = () => {
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
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
      <!-- Sidebar -->
      <div class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Settings</h2>
        </div>
        <nav class="flex-1 p-3 space-y-1">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id"
            :class="[
              'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
              activeSection === section.id
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            ]"
          >
            <component :is="section.icon" class="w-5 h-5" />
            <span class="text-sm">{{ section.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ sections.find(s => s.id === activeSection)?.label }}
          </h3>
          <button
            @click="handleClose"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto">
          <AccountTab v-if="activeSection === 'account'" />
          <UserManagementTab v-else-if="activeSection === 'users'" />
          <NotificationSubscribersTab v-else-if="activeSection === 'subscribers'" />
          <SchedulerTab v-else-if="activeSection === 'scheduler'" />
        </div>
      </div>
    </div>
  </div>
</template>
