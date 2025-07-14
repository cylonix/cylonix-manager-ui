<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrivacyStore } from '@/stores/privacy'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = usePrivacyStore()
const { agreed } = storeToRefs(store)
const banner = ref(!agreed.value)
const dialog = ref(false)
function accept() {
  banner.value = false
  agreed.value = true
}
function declineAll() {
  store.$reset()
  router.push('/no-service')
}
function saveAndAccept() {
  dialog.value = false
  accept()
}
</script>

<template>
  <v-bottom-sheet v-model="banner" inset persistent>
    <v-banner class="px-4 py-4" stacked>
      <template v-slot:prepend>
        <v-img width="48" src="@/assets/logo.png"></v-img>
      </template>
      <template v-slot:text class="test-center">
        Cylonix uses cookies to enable and import the use of the website. Please
        see our
        <router-link to="/web-privacy-policy" class="text-blue-darken-4"
          >Privacy Policy</router-link
        >
        for more information. By clicking "Accept Cookies" or continuing to use
        the site, you agree to the use of cookies.
      </template>

      <template v-slot:actions>
        <v-row justify="end">
          <v-dialog v-model="dialog" max-width="500">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="text-none mx-4 my-4"
                color="blue-darken-4"
                min-width="200"
                variant="outlined"
              >
                Manage Cookies
              </v-btn>
            </template>

            <v-card title="Cookie Settings">
              <v-card-text>
                <p class="pb-4">
                  Cylonix websites use cookies to deliver and improve the
                  visitor experience. Learn more about the cookies we use on our
                  Cookie Policy page.
                </p>

                <v-list-subheader class="font-weight-black text-high-emphasis"
                  >Required Cookies</v-list-subheader
                >

                <p class="mb-4">
                  These cookies are required for the site to function and cannot
                  be turned off. e.g. login cookies, security cookies,
                </p>

                <!-- v-list-subheader class="font-weight-black text-high-emphasis"
                  >Performance Cookies</v-list-subheader
                >

                <v-switch
                  v-model="performance"
                  :label="performance ? 'On' : 'Off'"
                  color="blue-darken-4"
                  density="compact"
                  hide-details
                  inline
                  inset
                ></v-switch>

                <p class="mb-4">
                  Counts website visits and clicks to understand where people
                  most engage with links to make the experience better.
                </p-->
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="justify-center px-6 py-3">
                <v-btn
                  class="flex-grow-1 text-none"
                  color="blue-darken-4"
                  variant="plain"
                  @click="declineAll"
                >
                  Decline All
                </v-btn>

                <v-btn
                  class="text-white flex-grow-1 text-none"
                  color="blue-darken-4"
                  variant="flat"
                  @click="saveAndAccept"
                >
                  Save and Accept
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-btn
            class="text-none mx-4 my-4 text-white"
            color="blue-darken-4"
            min-width="200"
            variant="flat"
            @click="accept"
          >
            Accept Cookies
          </v-btn>
        </v-row>
      </template>
    </v-banner>
  </v-bottom-sheet>
</template>
