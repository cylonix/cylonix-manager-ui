// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Notice } from '@/clients/manager/api'
import { WebSocketStatus } from '@vueuse/core'

export const useNoticeStore = defineStore(
  'notices',
  () => {
    const notices = ref<Array<Notice>>([])
    const wsStatus = ref<WebSocketStatus>()
    function $reset () {
      notices.value = []
      wsStatus.value = undefined
    }
    const wsStatusColor = computed(() => {
      switch (wsStatus.value) {
        case 'OPEN':
          return 'green'
        case 'CONNECTING':
          return 'primary'
        case 'CLOSED':
          return 'grey'
      }
    })

    return { notices, wsStatus, wsStatusColor, $reset }
  },
  {
    persist: true,
  }
)
