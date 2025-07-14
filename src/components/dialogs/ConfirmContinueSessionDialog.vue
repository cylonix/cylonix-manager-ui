<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { logout } from '@/plugins/logout'
import { useUserStore } from '@/stores/user'

const { loggedIn } = storeToRefs(useUserStore())
const dialog = ref(false)

let dialogTimeout: number
function idledForTooLong() {
  clearTimeout(idleTimeout)
  if (!loggedIn.value || dialog.value) {
    return
  }
  dialog.value = true
  dialogTimeout = setTimeout(async () => {
    if (!loggedIn.value) {
      return
    }
    console.log(new Date(), 'dialog timed out. signing out...')
    dialog.value = false
    await logout()
  }, 60 * 1000 /* 60 seconds */)
}

let idleTimeout: number
function resetIdleTimer() {
  clearTimeout(idleTimeout)
  idleTimeout = setTimeout(idledForTooLong, 600 * 1000 /* 600 seconds */)
}
function checkIdling() {
  resetIdleTimer()
  window.addEventListener('mousemove', resetIdleTimer, { passive: true })
  window.addEventListener('mousedown', resetIdleTimer, { passive: true })
  window.addEventListener('touchstart', resetIdleTimer, { passive: true })
  window.addEventListener('touchmove', resetIdleTimer, { passive: true })
  window.addEventListener('click', resetIdleTimer, { passive: true })
  window.addEventListener('keydown', resetIdleTimer, { passive: true })
  window.addEventListener('scroll', resetIdleTimer, { passive: true })
  window.addEventListener('wheel', resetIdleTimer, { passive: true })
}
onMounted(checkIdling)

function onOK() {
  console.log(`${new Date()} continue`)
  clearTimeout(dialogTimeout)
  resetIdleTimer()
  dialog.value = false
}

async function onCancel() {
  clearTimeout(dialogTimeout)
  clearTimeout(idleTimeout)
  dialog.value = false
  await logout()
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    okText="Yes, continue my session."
    cancelText="No, sign me out."
    text="Do you want to continue to connect to the Cylonix Manager?"
    @ok="onOK"
    @cancel="onCancel"
  >
  </ConfirmDialog>
</template>
