// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { LoginType, OauthProvider } from '@/clients/manager/api'

export const useLoginStore = defineStore(
  'login',
  () => {
    const loginType = ref<LoginType>(
      LoginType.Unknown
    )
    const namespace = ref()
    const namespaceType = ref('community')
    const oauthProvider = ref<OauthProvider | undefined>(undefined)
    function $reset() {
      namespace.value = undefined
      oauthProvider.value = undefined
    }
    return { loginType, namespace, namespaceType, oauthProvider, $reset }
  },
  {
    persist: true
  }
)
