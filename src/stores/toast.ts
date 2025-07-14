// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast } from '@/plugins/toast'

export const useToastStore = defineStore(
  'toast',
  () => {
    const toast = ref<Toast>({on: false})
    function $reset () {
      toast.value = {on: false}
    }
    return { toast, $reset }
  },
)
