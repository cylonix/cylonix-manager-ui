<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { ApproveParams, ApprovalState, TenantApproval } from '@/clients/manager'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'ID', key: 'id', align: 'center' },
  { title: 'Company Name', key: 'companyName' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Admin username', key: 'email' },
  { title: 'Admin password', key: 'password' },
  { title: 'State', key: 'state', value: 'approvalRecord.state' },
  {
    title: 'History',
    key: 'data-table-expand',
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const adminTenant = ref('')
const adminUsername = ref('')
const adminPassword = ref('')
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loadApprovalsOptions = ref()
const loading = ref(false)
const namespace = ref()
const note = ref()
const search = ref('')
const serverItems = ref<TenantApproval[]>([])
const store = useUserStore()
const totalItems = ref(0)
const { user } = storeToRefs(store)

function shortID(id: string): string {
  return id.substring(16, 22)
}

async function deleteItem(item: TenantApproval) {
  loading.value = true
  const ret = await tryRequest(async () => {
    await tenantAPI.deleteTenantApprovalRecords([item.id])
    newToast({
      on: true,
      color: 'green',
      text: `Tenant registration of id ${shortID(item.id)} ${
        item.companyName
      } has been deleted.`,
    })
    await loadApprovals(loadApprovalsOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function approveItem(item: TenantApproval) {
  item.namespace = namespace.value
  if (!item.namespace) {
    alert.value = {
      on: true,
      title: 'Missing namespace:',
      text: 'Please assign namespace for the tenant first.',
      type: 'warning',
    }
    return
  }
  if (!note.value) {
    alert.value = {
      on: true,
      text: 'Please leave a note.',
      type: 'warning',
    }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await tenantAPI.updateTenantRegistration(
      item.id,
      'default',
      '',
      {
        id: item.id,
        companyName: item.companyName,
        namespace: item.namespace,
        email: item.email,
        phone: item.phone,
        contactName: item.contactName,
        username: '',
        password: '',
        isSmsCode: false,
        code: '',
        approvalRecord: {
          history: [],
          state: ApprovalState.Approved,
        },
      },
      `Approved by ${user?.value?.displayName} (${shortUserID(
        user?.value?.userID
      )}): ${note.value}`
    )
    adminTenant.value = item.companyName
    adminUsername.value = item.email
    adminPassword.value = ret.data
    if (item.approvalRecord) {
      item.approvalRecord.state = ApprovalState.Approved
    }
    alert.value = {
      on: true,
      type: 'success',
      text:
        `"${item.companyName}" with ID ${item.namespace} ` +
        'has been updated and approved successfully.' +
        `An welcome email has been sent to ${item.email}` +
        `with the initial password below. Click the hidden text` +
        `to reveal the password.`,
    }
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
async function rejectItem(item: TenantApproval) {
  console.log('reject', item)
  if (await updateApprovalState([item.id], ApprovalState.Rejected)) {
    if (item.approvalRecord) {
      item.approvalRecord.state = ApprovalState.Rejected
    }
  }
}
function shortUserID(id: string | undefined): string | undefined {
  return id?.substring(0, 20)
}
async function updateApprovalState(
  idList: [string],
  state: any
): Promise<boolean> {
  loading.value = true
  let success = false
  const ret = await tryRequest(async () => {
    await tenantAPI.updateTenantApprovalRecords(<ApproveParams>{
      idList: idList,
      setState: state,
      note: `Updated to "${state}" by ${
        user?.value?.displayName
      } (${shortUserID(user?.value?.userID)}): ${note.value}`,
    })
    newToast({
      on: true,
      color: 'green',
      text: 'Tenant registration state has been updated successfully.',
    })
    success = true
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
  return success
}

function confirmDeleteText(item: TenantApproval): string {
  return `Delete approval record for "${item.companyName}"?`
}
function confirmApproveText(item: TenantApproval): string {
  return `Approve to add "${item.companyName}" as a tenant?`
}
function confirmRejectText(item: TenantApproval): string {
  return `Reject request of "${item.companyName}" to be a tenant?`
}
function getApprovalState(item: TenantApproval): any {
  return item.approvalRecord?.state
}
function getHistory(item: TenantApproval): any {
  return item.approvalRecord?.history
}
function namespaceValid(item: TenantApproval): boolean {
  return item.namespace || namespace.value
}
function preApprove(item: any) {
  namespace.value = item.namespace
}

async function loadApprovals(options: any) {
  loadApprovalsOptions.value = options
  loading.value = true
  console.log('loading tenant approvals')
  const ret = await tryRequest(async () => {
    // Parameters:
    // requestBody: Array<string>, companyName?: string,
    // email?: string, phoneNum?: string, code?: string, approvalState?: string,
    // contain?: string, filterBy?: string, filterValue?: string, page?: number,
    // pageSize?: number, sortBy?: string, sortDesc?: string
    const ret = await tenantAPI.getTenantApprovalRecords(
      [] /* id list */,
      undefined /* companyName */,
      undefined /* email */,
      undefined /* phoneNum */,
      undefined /* code */,
      undefined /* approvalState */,
      undefined /* contain */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      options.page,
      options.itemsPerPage
    )
    console.log(ret.data)
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
  })
  if (ret) {
    alert.value = ret
  }
  console.log('setting loading to false')
  loading.value = false
}
</script>
<template>
  <v-container class="fill-height">
    <Alert v-model="alert"></Alert>
    <v-container class="px-0" v-if="adminPassword" align="center" fluid>
      <v-chip closable variant="text" size="large"
        >Newly approved tenant '{{ adminTenant }}'. Admin username:
        {{ adminUsername }}, password:
        <HiddenPasswordChip
          :password="adminPassword"
          size="large"
        ></HiddenPasswordChip>
      </v-chip>
    </v-container>
    <v-row class="mx-1 my-2" align="center" justify="space-between">
      <v-chip size="large">Tenant approvals</v-chip>
      <RefreshButton @refresh="loadApprovals(loadApprovalsOptions)" />
    </v-row>
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
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id" />
      </template>

      <template v-slot:item.state="{ value }">
        <ApprovalStateChip :state="value" />
      </template>
      <template v-slot:expanded-row="{ item }">
        <History :history="getHistory(item)"> </History>
      </template>
      <template v-slot:item.password="{ item }">
        <HiddenPasswordChip
          v-if="item.password"
          :password="item.password"
        ></HiddenPasswordChip>
      </template>
      <template v-slot:item.actions="{ item }">
        <ApprovalActions
          v-model:note="note"
          :confirmApproveText="confirmApproveText(item)"
          :confirmDeleteText="confirmDeleteText(item)"
          :confirmRejectText="confirmRejectText(item)"
          :okApproveDisabled="!namespaceValid(item) || !note"
          :state="getApprovalState(item)"
          @delete="deleteItem(item)"
          @approve="approveItem(item)"
          @reject="rejectItem(item)"
          @pre-approve="preApprove(item)"
          ><template v-slot:approve-dialog>
            <NamespaceInput v-model="namespace" /> </template
        ></ApprovalActions>
      </template>
    </v-data-table-server>
  </v-container>
</template>
