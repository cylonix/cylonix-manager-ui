import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { camelizeKeys } from '@cylonix/humps'
import { useWebSocket } from '@vueuse/core'
import type { Notice } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { newToast } from '@/plugins/toast'
import { useNoticeStore } from '@/stores/notices'
import { useUserStore } from '@/stores/user'
import getEnv from '@/utils/env'

export function useWsNotices() {
  const { notices, wsStatus } = storeToRefs(useNoticeStore())
  const { isAdmin } = storeToRefs(useUserStore())
  const wsURL = getEnv('VITE_WS_URL')
  console.log('wsURL=', wsURL)

  const closeCode = ref()
  const alert = ref<Alert>()
  let retryCount = 0
  const { close, open, status } = useWebSocket(wsURL, {
    immediate: isAdmin.value == true,
    autoReconnect: {
      retries: () => {
        if (status.value != 'CLOSED') {
          console.log('Skip retry if connecting or already opened...')
          return false
        }
        retryCount++
        if (retryCount > 10) {
          retryCount = 0
        }
        return (
          (isAdmin.value ?? false) &&
          closeCode.value != 1008 &&
          closeCode.value != 3000
        )
      },
      delay: 5000 /* every 5 second */,
      onFailed() {
        // Notify error every 10 tries.
        if (retryCount < 10) {
          return
        }
        newToast({
          on: true,
          color: 'red',
          text: `Failed to connect web socket to "${wsURL}" after 3 retries.`
        })
      }
    },
    onConnected() {
      console.log(`Connected to web socket "${wsURL}"`)
      alert.value = undefined
    },
    onDisconnected(_, event) {
      console.log(`Disconnected from web socket "${wsURL}:"`, event)
      // TODO: try to use a formal name for the 'policy violation' code.
      closeCode.value = event.code
      switch (event.code) {
        case 1008:
          alert.value = <Alert>{
            on: true,
            text: `Server notice connection is closed. ${event.reason}`

          }
          break
        case 3000:
          if (isAdmin.value) {
            alert.value = <Alert>{
              on: true,
              text: 'Unauthorized for server connection.'
            }
          }
          break
        default:
          // Ignore other transient errors.
          break
      }
    },
    onError(_, event) {
      console.log('Connection error:', event)
    },
    onMessage(_, event) {
      console.log('received new web socket message event', event)
      if (event.data) {
        try {
          const n: Notice = camelizeKeys<Notice>(JSON.parse(event.data))
          if (n) {
            notices.value.unshift(n)
          }
        } catch (e) {
          console.log('failed to parse web socket data:', event.data)
        }
      }
    }
  })

  function connect() {
    if (status.value != 'OPEN') {
      console.log('open web socket')
      open()
    }
  }

  watch(status, newValue => {
    wsStatus.value = newValue
  })

  watch(isAdmin, newValue => {
    if (newValue) {
      console.log('Logged in. Connecting to web socket for notices...')
      open()
    } else {
      console.log('No longer logged in. Disconnecting from the web socket.')
      close()
    }
  })

  return {
    alert,
    connect,
    notices,
    status
  }
}
