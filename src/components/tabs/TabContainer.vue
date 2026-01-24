<script setup lang="ts">
import { ref, onMounted, watch, type Component } from 'vue'

interface Tab {
  id: string
  label: string
  icon: Component
}

const props = defineProps<{
  tabs: Tab[]
  storageKey?: string
}>()

const activeTab = ref(props.tabs[0]?.id || '')

// Load active tab from localStorage on mount
onMounted(() => {
  if (props.storageKey) {
    const saved = localStorage.getItem(props.storageKey)
    if (saved && props.tabs.some((tab) => tab.id === saved)) {
      activeTab.value = saved
    }
  }
})

// Save active tab to localStorage when it changes
watch(activeTab, (newTab) => {
  if (props.storageKey) {
    localStorage.setItem(props.storageKey, newTab)
  }
})

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

defineExpose({ setActiveTab })
</script>

<template>
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <nav class="flex overflow-x-auto px-6 scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          :class="[
            'flex items-center space-x-2 px-4 py-4 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap',
            activeTab === tab.id
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300',
          ]"
        >
          <component :is="tab.icon" class="w-5 h-5" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="transition-opacity duration-200">
      <slot :name="activeTab" />
    </div>
  </div>
</template>
