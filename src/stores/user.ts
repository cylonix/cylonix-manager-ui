// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { LoginConfirmSession, Tenant, User } from "@/clients/manager/api"

export const useUserStore = defineStore(
  "user",
  () => {
    const adminContext = ref(true)
    const apiKey = ref('')
    const loginConfirmSession = ref<LoginConfirmSession>()
    const tenant = ref<Tenant>()
    const user = ref<User>()
    const updatedAt = ref(0)
    const ttl = 7 * 24 * 3600 // 7 days in seconds
    const isNetworkAdmin = computed(() => {
      return user.value?.roles?.includes('network-admin') && adminContext.value
    })
    const isAdmin = computed(() => {
      return user.value?.isAdmin && adminContext.value
    })
    const isSysAdmin = computed(() => {
      return user.value?.isSysAdmin && adminContext.value
    })
    const loggedIn = computed(() => {
      return tenant.value != undefined && user.value != undefined
    })
    const namespace = computed(() => {
      return tenant.value?.namespace
    })
    const username = computed(() => {
      if (user.value?.displayName) {
        return user.value?.displayName
      }
      const logins = user.value?.logins
      if (logins && logins.length > 0) {
        if (logins[0]?.displayName) {
          return logins[0]?.displayName
        }
        return logins[0]?.login
      }
    })
    function $checkExpiration() {
      let passed = (Date.now() - updatedAt.value) / 1000 // seconds
      if (passed >= ttl) {
        $reset()
      }
    }
    function $reset() {
      apiKey.value = ''
      tenant.value = undefined
      user.value = undefined
      updatedAt.value = 0
      console.log("User store reset")
    }
    return {
      adminContext,
      apiKey,
      isAdmin,
      isNetworkAdmin,
      isSysAdmin,
      loggedIn,
      loginConfirmSession,
      namespace,
      tenant,
      updatedAt,
      user,
      username,
      $checkExpiration,
      $reset,
    }
  },
  {
    persist: true,
  }
)
