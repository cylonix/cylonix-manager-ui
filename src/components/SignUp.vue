<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
const namespaceType = ref('community')
const { width } = useDisplay()
const vertical = computed(() => {
  if (width.value <= 700) {
    return 'vertical'
  }
  return undefined
})
const align = computed(() => {
  if (width.value > 700) {
    return 'center'
  }
  return undefined
})
</script>
<template>
  <v-sheet class="mx-auto" max-width="1000">
    <v-tabs
      v-model="namespaceType"
      class="mx-2 my-4"
      grow
      :align-tabs="align"
      :direction="vertical"
    >
      <v-tab
        value="enterprise"
        class="text-none"
        text="Sign up for your company"
      ></v-tab>
      <v-tab
        value="community"
        class="text-none"
        text="Sign up as a free community user"
      ></v-tab>
    </v-tabs>

    <v-tabs-window v-model="namespaceType">
      <v-tabs-window-item value="enterprise">
        <EnterpriseSignUp />
      </v-tabs-window-item>
      <v-tabs-window-item value="community">
        <CommunityUserSignUp />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-sheet>
</template>
