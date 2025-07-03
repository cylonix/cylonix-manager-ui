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
