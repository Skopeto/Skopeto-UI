<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X } from 'lucide-vue-next'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{
  serverId: number | null
  serverName: string
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const terminalRef = ref<HTMLDivElement | null>(null)
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let websocket: WebSocket | null = null

const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
const errorMessage = ref('')

const initTerminal = () => {
  if (!terminalRef.value) return

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      cursorAccent: '#1e1e1e',
      selectionBackground: '#264f78',
    },
    scrollback: 10000,
    convertEol: false,
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(terminalRef.value)

  setTimeout(() => {
    fitAddon.fit()
    terminal?.focus()
    sendResize()
  }, 100)

  terminal.onData((data) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(
        JSON.stringify({
          type: 'input',
          data: data,
        }),
      )
    }
  })
}

const sendResize = () => {
  if (websocket && websocket.readyState === WebSocket.OPEN && terminal) {
    websocket.send(
      JSON.stringify({
        type: 'resize',
        cols: terminal.cols,
        rows: terminal.rows,
      }),
    )
  }
}

const connectWebSocket = () => {
  if (!props.serverId) return

  connectionStatus.value = 'connecting'
  errorMessage.value = ''

  const token = localStorage.getItem('access_token')
  const wsUrl = `ws://localhost:8000/ws/shell/${props.serverId}${token ? `?token=${token}` : ''}`

  websocket = new WebSocket(wsUrl)

  websocket.onopen = () => {
    connectionStatus.value = 'connected'
    sendResize()
  }

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)

      if (message.type === 'output') {
        terminal?.write(message.data)
      } else if (message.type === 'error') {
        terminal?.writeln(`\r\n\x1b[31m${message.data}\x1b[0m`)
        errorMessage.value = message.data
        connectionStatus.value = 'error'
      }
    } catch (e) {
      terminal?.write(event.data)
    }
  }

  websocket.onerror = () => {
    connectionStatus.value = 'error'
    errorMessage.value = 'WebSocket connection error'
    terminal?.writeln('\r\n\x1b[31mConnection error occurred.\x1b[0m')
  }

  websocket.onclose = (event) => {
    connectionStatus.value = 'disconnected'
    if (event.code !== 1000) {
      terminal?.writeln(`\r\n\x1b[33mConnection closed (code: ${event.code}).\x1b[0m`)
    }
  }
}

const disconnect = () => {
  if (websocket) {
    websocket.close()
    websocket = null
  }
}

const cleanup = () => {
  disconnect()
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
  if (fitAddon) {
    fitAddon = null
  }
}

const handleClose = () => {
  cleanup()
  emit('close')
}

const handleResize = () => {
  if (fitAddon && terminal) {
    setTimeout(() => {
      fitAddon.fit()
      sendResize()
    }, 0)
  }
}

const handleTerminalClick = () => {
  terminal?.focus()
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.serverId) {
      await nextTick()
      initTerminal()
      connectWebSocket()
      window.addEventListener('resize', handleResize)
    } else {
      window.removeEventListener('resize', handleResize)
      cleanup()
    }
  },
)

onMounted(() => {
  if (props.isOpen && props.serverId) {
    nextTick(() => {
      initTerminal()
      connectWebSocket()
      window.addEventListener('resize', handleResize)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanup()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="bg-gray-900 rounded-xl shadow-2xl w-[90vw] h-[80vh] max-w-6xl flex flex-col overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0"
        >
          <div class="flex items-center space-x-3">
            <div class="flex space-x-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span class="text-gray-300 text-sm font-medium"> Terminal - {{ serverName }} </span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full',
                connectionStatus === 'connected' && 'bg-green-500/20 text-green-400',
                connectionStatus === 'connecting' && 'bg-yellow-500/20 text-yellow-400',
                connectionStatus === 'disconnected' && 'bg-gray-500/20 text-gray-400',
                connectionStatus === 'error' && 'bg-red-500/20 text-red-400',
              ]"
            >
              {{ connectionStatus }}
            </span>
          </div>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div
          ref="terminalRef"
          class="flex-1 bg-[#1e1e1e] cursor-text overflow-hidden"
          @click="handleTerminalClick"
        ></div>

        <div v-if="errorMessage" class="px-4 py-2 bg-red-900/50 border-t border-red-800 shrink-0">
          <p class="text-red-300 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
