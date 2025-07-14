<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Device, Label } from '@/clients/manager/api'

const emit = defineEmits(['add', 'delete'])
const label = defineModel<Label>()
const props = defineProps<{
  device?: Device
  labels?: Array<Label>
  allLabels?: Array<Label>
  addTitle?: string
  confirmAddTitle?: string
  confirmDelTitle?: string
}>()

const dialog = ref(false)
const dialogTitle = ref('')
const event = ref<'add' | 'delete'>('delete')
const addLabels = computed(() => {
  const add = props.allLabels?.filter((l) => {
    return !(props.labels?.some((l1) => l1.id == l.id) ?? false)
  })
  return add
})

function deleteLabel(v: Label) {
  label.value = v
  emit('delete')
}
function addLabel(v: Label) {
  label.value = v
  event.value = 'add'
  dialog.value = true
  dialogTitle.value =
    props.confirmAddTitle ?? 'Confirm to add vpn label to device'
}
function confirmed() {
  emit(event.value)
  dialog.value = false
}
</script>

<template>
  <template v-if="labels"
    ><v-chip v-for="n in labels" :key="n.id" :color="n.color">
      <template v-slot:append>
        <DeleteButton
          :title="confirmDelTitle ?? 'Confirm to delete vpn label from device'"
          @delete="deleteLabel(n)"
        >
          <template v-slot:delete-dialog>
            <DeviceCard :device="device" variant="plain" />
            <LabelCard :label="n" variant="plain" />
          </template>
        </DeleteButton>
      </template>
      <span>{{ n.name }}</span>
      <v-menu class="mt-2" activator="parent" open-on-hover>
        <LabelCard :label="n" />
      </v-menu> </v-chip
  ></template>
  <v-menu v-if="(addLabels?.length ?? 0) > 0">
    <template v-slot:activator="{ props: menu }">
      <AddButton label="Add vpn label" :parent-props="menu" />
    </template>
    <v-card>
      <v-card-title>Select a vpn label to add</v-card-title>
      <v-card-item>
        <v-chip
          class="mx-1 px-2 py-1"
          v-for="n in addLabels"
          :key="n.id"
          size="large"
          :color="n.color"
          @click="addLabel(n)"
        >
          <span>{{ n.name }}</span>
          <v-menu class="m-1" activator="parent" open-on-hover>
            <LabelCard :label="n" />
          </v-menu> </v-chip></v-card-item
    ></v-card>
  </v-menu>
  <ConfirmDialog v-model="dialog" :title="dialogTitle" @ok="confirmed"
    ><template v-slot:item>
      <DeviceCard :device="device" variant="plain" />
      <LabelCard :label="label" variant="plain" />
    </template>
  </ConfirmDialog>
</template>
