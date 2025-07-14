<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import {
  ApproveParams,
  ApprovalState,
  UserApprovalInfo,
} from '@/clients/manager'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const headers = ref([
  {
    title: 'ID',
    key: 'id',
    value: (item: any) => shortID(item),
  },
  {
    title: 'Name',
    key: 'name',
    value: (item: any) => item.login.displayName ?? '',
  },
  {
    title: 'Login',
    key: 'login',
    value: (item: any) => item.login.login ?? '',
  },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'State', key: 'state', value: 'approvalRecord.state' },
  {
    title: 'History',
    key: 'data-table-expand',
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loadApprovalsOptions = ref()
const loading = ref(false)
const note = ref()
const search = ref('')
const serverItems = ref<UserApprovalInfo[]>([])
const store = useUserStore()
const totalItems = ref(0)
const { isSysAdmin, namespace, user } = storeToRefs(store)

function shortID(item: any): string {
  const id = item.approvalRecord?.id
  return id?.substring(6, 11) ?? ''
}

async function deleteItem(item: UserApprovalInfo) {
  const ret = await tryRequest(async () => {
    loading.value = true
    const id = item.id
    if (!id) {
      throw Error('User approval has no ID assigned.')
    }
    await userAPI.deleteUserApprovals([id])
    await loadApprovals(loadApprovalsOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `User approval for ${name(item)} has been deleted.`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function approveItem(item: UserApprovalInfo) {
  if (!note.value) {
    alert.value = {
      on: true,
      text: 'Please leave an approval note.',
    }
    return
  }
  const ret = await tryRequest(async () => {
    const id = item.id
    if (!id) {
      throw Error('User approval has no ID assigned.')
    }
    loading.value = true
    await userAPI.updateUserApproval(<ApproveParams>{
      idList: [id],
      note: `Approved by ${user?.value?.displayName} (${shortUserID(
        user?.value?.userID
      )}): ${note.value}`,
      setState: ApprovalState.Approved,
    })
    if (item.approvalRecord) {
      item.approvalRecord.state = ApprovalState.Approved
    }
    newToast({
      on: true,
      color: 'green',
      text: `User approval for ${name(item)} has been approved successfully.`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function rejectItem(item: UserApprovalInfo) {
  console.log('reject', item)
  if (!note.value) {
    alert.value = {
      on: true,
      text: 'Please leave a rejection note.',
    }
    return
  }
  const id = item.id
  if (!id) {
    alert.value = {
      on: true,
      text: 'User approval has no ID assigned.',
    }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.updateUserApproval(<ApproveParams>{
      idList: [id],
      note: `Rejected by ${user?.value?.displayName} (${shortUserID(
        user?.value?.userID
      )}): ${note.value}`,
      setState: ApprovalState.Rejected,
    })
    if (item.approvalRecord) {
      item.approvalRecord.state = ApprovalState.Rejected
    }
    newToast({
      on: true,
      color: 'green',
      text: `User approval for ${name(item)} has been rejected successfully.`,
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
function name(item: UserApprovalInfo): string {
  const login = item.login
  return `${login.login}(${login.displayName})`
}

function confirmDeleteText(item: UserApprovalInfo): string {
  return `Delete approval record for "${name(item)}"?`
}
function confirmApproveText(item: any): string {
  return `Approve to add "${name(item)}" as a user?`
}
function confirmRejectText(item: any): string {
  return `Reject request of "${name(item)}" to be a user?`
}
function getApprovalState(item: any): any {
  return item.approvalRecord.state
}
function getHistory(item: any): any {
  return item.approvalRecord.history
}

async function loadApprovals(options: any) {
  loadApprovalsOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    // Parameters:
    // requestBody: Array<string>, namespace?: string, companyName?: string,
    // email?: string, phoneNum?: string, code?: string, approvalState?: string,
    // contain?: string, filterBy?: string, filterValue?: string, page?: number,
    // pageSize?: number, sortBy?: string, sortDesc?: string
    const ret = await userAPI.getUserApprovals(
      [] /* id list */,
      isSysAdmin.value ? undefined : namespace.value /* namespace */,
      undefined /* email */,
      undefined /* phoneNum */,
      undefined /* code */,
      undefined /* contain */,
      undefined /* isAdmin */,
      undefined /* approvalState */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      0 /* page */,
      options.itemsPerPage
    )
    console.log(ret.data)
    totalItems.value = ret?.data?.total ?? 0
    serverItems.value = ret?.data?.items ?? []
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <v-container class="fill-height">
    <Alert v-model="alert"></Alert>
    <v-chip size="large">User approvals</v-chip>
    <RefreshButton @refresh="loadApprovals(loadApprovalsOptions)" />
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
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
  </v-container>
</template>
