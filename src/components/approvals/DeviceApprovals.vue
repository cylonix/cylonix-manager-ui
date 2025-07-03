<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { ApprovalState, DeviceApprovalRecord } from '@/clients/manager'
import type { Alert } from '@/plugins/alert'
import { deviceAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loadApprovalsOptions = ref()
const loading = ref(false)
const search = ref('')
const serverItems = ref<DeviceApprovalRecord[]>([])
const totalItems = ref(0)

async function loadApprovals(options: any) {
  loadApprovalsOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await deviceAPI.listDeviceApprovalRecords(
      [], // id_list
      undefined, // contain
      undefined, // filter_by
      undefined, // filter_value
      options.sortBy[0]?.key, // sort_by
      options.sortBy[0]?.order, // sort_desc
      undefined, // approval_state
      options.page, // page_num
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.records ?? []
  })

  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

const headers = ref([
  {
    title: 'ID',
    key: 'approvalID',
  },
  {
    title: 'Username',
    key: 'username',
    value: (item: any) => item.username ?? '',
  },
  {
    title: 'Hostname',
    key: 'hostname',
    value: (item: any) => item.hostname ?? '',
  },
  { title: 'OS', key: 'os' },
  { title: 'Note', key: 'note' },
  { title: 'State', key: 'state', value: 'approvalRecord.state' },
  {
    title: 'History',
    key: 'data-table-expand',
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const note = ref()
const store = useUserStore()
const { user } = storeToRefs(store)

async function deleteItem(item: DeviceApprovalRecord) {
  loading.value = true
  const ret = await tryRequest(async () => {
    const id = item.approvalID
    if (id == '') {
      throw Error('Device approval has no ID assigned.')
    }
    await deviceAPI.deleteDeviceApprovalRecords([id])
    await loadApprovals(loadApprovalsOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Device approval for ${name(item)} has been deleted.`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function approveItem(item: DeviceApprovalRecord) {
  if (!note.value) {
    alert.value = {
      on: true,
      text: 'Please leave an approval note.',
    }
    return
  }
  const ret = await tryRequest(async () => {
    const id = item.approvalID
    if (id == '') {
      throw Error('Device approval has no ID assigned.')
    }
    const uID = user.value?.userID
    if (!uID) {
      throw Error('Empty user ID')
    }
    loading.value = true
    await deviceAPI.approveDevices(
      ApprovalState.Approved,
      `Approved by ${user?.value?.displayName} (${shortUserID(uID)}): ${
        note.value
      }`,
      [id]
    )
    await loadApprovals(loadApprovalsOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Device approval for ${name(item)} has been approved successfully.`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function rejectItem(item: DeviceApprovalRecord) {
  console.log('reject', item)
  if (!note.value) {
    alert.value = {
      on: true,
      text: 'Please leave a rejection note.',
    }
    return
  }
  const id = item.approvalID
  if (id == '') {
    alert.value = {
      on: true,
      text: 'Device approval has no ID assigned.',
    }
    return
  }
  const uID = user.value?.userID
  if (!uID) {
    throw Error('Empty user ID')
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await deviceAPI.approveDevices(
      ApprovalState.Rejected,
      `Rejected by ${user?.value?.displayName} (${shortUserID(uID)}): ${
        note.value
      }`,
      [id]
    )
    await loadApprovals(loadApprovalsOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Device approval for ${name(item)} has been rejected successfully.`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
function shortUserID(id: string | undefined): string | undefined {
  return id?.substring(0, 20)
}
function name(item: DeviceApprovalRecord): string {
  return `${item.hostname} of ${item.username}`
}

function confirmDeleteText(item: DeviceApprovalRecord): string {
  return `Delete approval record for "${name(item)}"?`
}
function confirmApproveText(item: any): string {
  return `Approve request of adding "${name(item)}" as a device?`
}
function confirmRejectText(item: any): string {
  return `Reject request of adding "${name(item)}" as a device?`
}
function getApprovalState(item: any): any {
  return item.approvalRecord.state
}
function getHistory(item: any): any {
  return item.approvalRecord.history
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="ma-2" align="center" justify="space-between">
      <v-chip class="mx-2" size="large">Device approvals</v-chip>
      <RefreshButton @refresh="loadApprovals(loadApprovalsOptions)" />
    </v-row>
    <v-data-table-server
      v-if="serverItems.length > 0"
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="totalItems < itemsPerPage"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      show-expand
      @update:options="loadApprovals"
    >
      <template v-slot:item.state="{ value }">
        <ApprovalStateChip :state="value" />
      </template>
      <template v-slot:expanded-row="{ item }">
        <History :history="getHistory(item)"> </History>
      </template>
      <template v-slot:item.actions="{ item }">
        <ApprovalActions
          v-model:note="note"
          :confirmApproveText="confirmApproveText(item)"
          :confirmDeleteText="confirmDeleteText(item)"
          :confirmRejectText="confirmRejectText(item)"
          :loading="loading"
          :state="getApprovalState(item)"
          @delete="deleteItem(item)"
          @approve="approveItem(item)"
          @reject="rejectItem(item)"
        ></ApprovalActions>
      </template>
    </v-data-table-server>
    <v-row v-else class="mx-2">
      <v-col cols="12" class="text-center">
        <v-alert type="info" class="mt-2"> No device approvals found. </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>
