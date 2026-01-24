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
const shouldClose = ref(false)

const initTerminal = () => {
  if (!terminalRef.value) return

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#0d1117',
      foreground: '#f0f6fc',
      cursor: '#58a6ff',
      cursorAccent: '#0d1117',
      selectionBackground: '#264f78',
      black: '#484f58',
      red: '#ff7b72',
      green: '#3fb950',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39c5cf',
      white: '#b1bac4',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#f0f6fc',
    },
    scrollback: 10000,
    convertEol: false,
    allowProposedApi: true,
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

  websocket.onclose = () => {
    connectionStatus.value = 'disconnected'
    websocket = null
    // Always signal to close modal when connection drops
    shouldClose.value = true
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
      fitAddon?.fit()
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
      shouldClose.value = false
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

// Watch for shouldClose flag to close modal when connection drops
watch(shouldClose, (close) => {
  if (close && props.isOpen) {
    cleanup()
    emit('close')
  }
})

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
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg"
      >
        <div
          class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 w-[90vw] h-[80vh] max-w-6xl flex flex-col overflow-hidden"
        >
        <div
          class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-600/50 backdrop-blur-sm shrink-0"
        >
          <div class="flex items-center space-x-3">
            <div class="flex space-x-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span class="text-gray-100 text-sm font-semibold tracking-wide"> Terminal - {{ serverName }} </span>
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  connectionStatus === 'connected' && 'bg-green-400 shadow-lg shadow-green-400/50',
                  connectionStatus === 'connecting' && 'bg-yellow-400 shadow-lg shadow-yellow-400/50 animate-pulse',
                  connectionStatus === 'disconnected' && 'bg-gray-400 shadow-lg shadow-gray-400/30',
                  connectionStatus === 'error' && 'bg-red-400 shadow-lg shadow-red-400/50 animate-pulse',
                ]"
              ></div>
              <span
                :class="[
                  'text-xs font-medium px-3 py-1 rounded-full border transition-all duration-300',
                  connectionStatus === 'connected' && 'bg-green-500/10 text-green-300 border-green-500/30',
                  connectionStatus === 'connecting' && 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                  connectionStatus === 'disconnected' && 'bg-gray-500/10 text-gray-300 border-gray-500/30',
                  connectionStatus === 'error' && 'bg-red-500/10 text-red-300 border-red-500/30',
                ]"
              >
                {{ connectionStatus }}
              </span>
            </div>
          </div>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-gray-700/50 hover:scale-105"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div
          ref="terminalRef"
          class="flex-1 bg-gradient-to-br from-[#0d1117] to-[#161b22] cursor-text overflow-hidden border-x border-gray-600/30"
          @click="handleTerminalClick"
        ></div>

        <div v-if="errorMessage" class="px-6 py-3 bg-gradient-to-r from-red-900/40 to-red-800/40 border-t border-red-700/50 backdrop-blur-sm shrink-0">
          <p class="text-red-300 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
      </div>
    </Transition>
  </Teleport>
</template>
