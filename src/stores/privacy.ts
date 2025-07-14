// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { ref } from "vue"
import { defineStore } from "pinia"

export const usePrivacyStore = defineStore("privacy", () => {
  const agreed = ref(false)
  function $reset() {
    agreed.value = false
  }
  return { agreed, $reset }
}, {
  persist: true
})
