<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { decamelize } from '@cylonix/humps'
import {
  Device,
  DeviceUpdate,
  Label,
  LabelCategory,
} from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { deviceAPI, labelAPI, tryRequest } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { hexTo64 } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'Device ID', key: 'id', align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'Alias', key: 'nameAlias' },
  {
    title: 'User',
    key: 'user',
    value: (n: any) => n.userShortInfo.displayName,
  },
  { title: 'IP', key: 'ip', value: (n: any) => n.wgInfo?.addresses[0] },
  { title: 'Public key', key: 'publicKey', align: 'center' },
  {
    title: 'Last seen',
    key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen * 1000),
  },
  { title: 'Exit node', key: 'exitNode', align: 'center' },
  { title: 'VPN Labels', key: 'vpnLabels', align: 'end' },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const sysAdminViewHeaders = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  ...headers.value,
] as const)

const addDialog = ref(false)
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const label = ref<Label>()
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<Device[]>()
const totalItems = ref(0)
const vpnLabels = ref<Array<Label>>()

const store = useUserStore()
const { isAdmin, isSysAdmin, user } = storeToRefs(store)

function shortID(id: string | undefined): string | undefined {
  return id?.substring(0)
}

function name(item: Device): string {
  return item.name
}

async function deleteItem(item: Device) {
  loading.value = true
  const ret = await tryRequest(async () => {
    await deviceAPI.deleteDevices([item.id])
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted device ${name(item)}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting device.')
  loading.value = false
}

function getApiUserID(): string | undefined {
  let uID = user.value?.userID
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
    }
    return
  }
  if (isAdmin.value) {
    uID = undefined
  }
  return uID
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true

  const ret = await tryRequest(async () => {
    /**
     * List and filter the devices
     * @summary get devices
     * @param {string} [userID]
     * @param {string} [deviceID]
     * @param {string} [capability] filter base on device capability
     * @param {string} [filterBy] filter by which field name
     * @param {string} [filterValue] filter with the value of the field
     * @param {string} [contain] typically used to filter any field that contains a string
     * @param {number} [page]
     * @param {number} [pageSize]
     * @param {string} [sortBy]
     * @param {string} [sortDesc]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DeviceApi
     */
    var sortBy = options.sortBy[0]?.key
    if (sortBy) {
      sortBy = decamelize(sortBy)
    }
    const ret = await deviceAPI.getDevices(
      getApiUserID(),
      undefined /* device id */,
      undefined /* capability */,
      undefined /* filter by */,
      undefined /* filter value */,
      undefined /* contain */,
      options.page,
      options.itemsPerPage,
      sortBy /* sortBy */,
      options.sortBy[0]?.order /* sortDesc */
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.devices ?? []
    console.log('devices:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading devices.')
  loading.value = false
}

function confirmDeleteText(item: Device): string {
  return `Delete device "${item.name}" with ID "${shortID(item.id)}"?`
}

function addButtonClicked() {
  addDialog.value = true
}

onMounted(async () => {
  await loadVpnLabels()
})

async function loadVpnLabels() {
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await labelAPI.listLabel(
      undefined,
      undefined,
      LabelCategory.Vpn
    )
    vpnLabels.value = ret?.data.items
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function addDelDeviceVpnLabel(
  device: Device,
  del: boolean,
  label?: Label
) {
  if (!label) {
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    await deviceAPI.putDevice(device.id, <DeviceUpdate>{
      addLabels: del ? undefined : [label],
      delLabels: del ? [label] : undefined,
    })
    newToast({
      on: true,
      color: 'green',
      text: `Successfully ${del ? 'deleted' : 'added'} vpn label ${
        label.name
      } from ${device.name})}`,
    })
    loadItems(loadOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-chip size="large">Devices</v-chip>
    <v-row align="center" justify="end">
      <v-btn class="mx-1" @click="addButtonClicked">Add device</v-btn>
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="isSysAdmin ? sysAdminViewHeaders : headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id"></ShortenTextChip>
      </template>
      <template v-slot:item.publicKey="{ item }">
        <ShortenTextChip
          v-if="item.wgInfo?.publicKey"
          :text="hexTo64(item.wgInfo?.publicKey ?? '')"
        ></ShortenTextChip>
      </template>
      <template v-slot:item.exitNode="{ item }">
        <ShortenTextChip
          v-if="item.wgInfo?.wgName"
          :short-text="item.wgInfo?.wgName"
          :text="item.wgInfo?.wgName + ': ' + item.wgInfo?.wgID"
        ></ShortenTextChip>
      </template>
      <template v-slot:item.vpnLabels="{ item }">
        <VpnLabelChips
          :device="item"
          :labels="item.vpnLabels"
          :all-labels="vpnLabels"
          v-model="label"
          @add="addDelDeviceVpnLabel(item, false, label)"
          @delete="addDelDeviceVpnLabel(item, true, label)"
        />
      </template>
      <template v-slot:item.actions="{ item }">
        <DeleteButton
          v-model:note="note"
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteItem(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table-server>
    <AddDeviceDialog
      v-model="addDialog"
      withNamespace
      withUsername
      @added="loadItems(loadOptions)"
    >
    </AddDeviceDialog>
  </v-container>
</template>
