import { ref } from 'vue'
import { defineStore } from 'pinia'
import { LoginType } from '@/clients/manager/api'

export const useLoginStore = defineStore(
  'login',
  () => {
    const loginType = ref<LoginType>(
      LoginType.Unknown
    )
    const namespace = ref()
    const namespaceType = ref('community')
    function $reset() {
      namespace.value = undefined
    }
    return { loginType, namespace, namespaceType, $reset }
  },
  {
    persist: true
  }
)
