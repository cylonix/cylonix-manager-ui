<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IPRoute } from '@/clients/supervisor'
const props = defineProps<{
  route: IPRoute
  size?: string
}>()
const emit = defineEmits(['delete'])
const menu = ref(false)
const confirmDeleteText = computed(() => {
  const dest = props.route.dest
  const via = props.route.via
  return `Please confirm to delete "${dest} -> ${via}" on this routing gateway`
})
</script>
<template>
  <v-menu
    v-model="menu"
    location="bottom center"
    origin="top start"
    transition="scale-transition"
    open-on-hover
  >
    <template v-slot:activator="{ props }">
      <v-chip class="mx-1 my-1" v-bind="props" >
        <template v-slot:default>
          <span class="route-label">{{ route.dest }} -> {{ route.via }}</span>
        </template>
        <template v-slot:append>
          <DeleteButton
            :title="`Confirm to delete route ${route.dest}`"
            :confirmDeleteText="confirmDeleteText"
            @delete="emit('delete')"
          >
            <template v-slot:delete-dialog>
              <v-card class="ma-2" variant="plain">
                <v-card-item
                  ><v-data-table :items="[route]" hide-default-footer>
                    <template v-slot:bottom></template></v-data-table
                ></v-card-item>
              </v-card>
            </template>
          </DeleteButton>
        </template>
      </v-chip>
    </template>
    <v-card>
      <v-card-item
        ><v-data-table :items="[route]" hide-default-footer>
          <template v-slot:bottom></template></v-data-table
      ></v-card-item>
    </v-card>
  </v-menu>
</template>

<style scoped>
.route-label {
  min-width: 200px;
}
</style>
