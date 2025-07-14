// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePolicyStore = defineStore(
  'policy',
  () => {
    const policy = ref('')
    function $reset() {
      policy.value = ''
    }
    return { policy, $reset }
  },
  {
    persist: true
  }
)
