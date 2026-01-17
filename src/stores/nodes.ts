// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { V1Node } from "@/clients/headscale/api"
import { User } from "@/clients/manager/api"

export const useNodesStore = defineStore(
  "nodes",
  () => {
    // My Nodes state
    const myNodes = ref<V1Node[]>([])
    const totalMyNodes = ref(0)
    const myNodesUpdatedAt = ref(0)

    // Shared Nodes state
    const sharedNodes = ref<V1Node[]>([])
    const totalSharedNodes = ref(0)
    const sharedNodesUpdatedAt = ref(0)

    // All Users state
    const allUsers = ref<User[]>([])
    const allUsersUpdatedAt = ref(0)

    // TTL for cache expiration (5 minutes in milliseconds)
    const ttl = 5 * 60 * 1000

    // Computed properties
    const hasMyNodes = computed(() => {
      return myNodes.value.length > 0
    })

    const hasSharedNodes = computed(() => {
      return sharedNodes.value.length > 0
    })

    // Check if my nodes cache is valid
    function isMyNodesValid() {
      // If never loaded, not valid
      if (myNodesUpdatedAt.value === 0) return false
      // Check if cache has expired
      const elapsed = Date.now() - myNodesUpdatedAt.value
      return elapsed < ttl
    }

    // Check if shared nodes cache is valid
    function isSharedNodesValid() {
      // If never loaded, not valid
      if (sharedNodesUpdatedAt.value === 0) return false
      // Check if cache has expired
      const elapsed = Date.now() - sharedNodesUpdatedAt.value
      return elapsed < ttl
    }

    // Check if all users cache is valid
    function isAllUsersValid() {
      // If never loaded, not valid
      if (allUsersUpdatedAt.value === 0) return false
      // Check if cache has expired
      const elapsed = Date.now() - allUsersUpdatedAt.value
      return elapsed < ttl
    }

    // Set my nodes
    function setMyNodes(nodes: V1Node[], total: number) {
      myNodes.value = nodes
      totalMyNodes.value = total
      myNodesUpdatedAt.value = Date.now()
    }

    // Set shared nodes
    function setSharedNodes(nodes: V1Node[], total: number) {
      sharedNodes.value = nodes
      totalSharedNodes.value = total
      sharedNodesUpdatedAt.value = Date.now()
    }

    // Set all users
    function setAllUsers(users: User[]) {
      allUsers.value = users
      allUsersUpdatedAt.value = Date.now()
    }

    // Clear my nodes cache
    function clearMyNodes() {
      myNodes.value = []
      totalMyNodes.value = 0
      myNodesUpdatedAt.value = 0
    }

    // Clear shared nodes cache
    function clearSharedNodes() {
      sharedNodes.value = []
      totalSharedNodes.value = 0
      sharedNodesUpdatedAt.value = 0
    }

    // Clear all users cache
    function clearAllUsers() {
      allUsers.value = []
      allUsersUpdatedAt.value = 0
    }

    // Reset all
    function $reset() {
      clearMyNodes()
      clearSharedNodes()
      clearAllUsers()
      console.log("Nodes store reset")
    }

    return {
      // State
      myNodes,
      totalMyNodes,
      myNodesUpdatedAt,
      sharedNodes,
      totalSharedNodes,
      sharedNodesUpdatedAt,
      allUsers,
      allUsersUpdatedAt,

      // Computed
      hasMyNodes,
      hasSharedNodes,

      // Actions
      isMyNodesValid,
      isSharedNodesValid,
      isAllUsersValid,
      setMyNodes,
      setSharedNodes,
      setAllUsers,
      clearMyNodes,
      clearSharedNodes,
      clearAllUsers,
      $reset,
    }
  },
  {
    persist: true,
  }
)
