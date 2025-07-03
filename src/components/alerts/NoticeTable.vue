<script setup lang="ts">
import { capitalize, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NoticeCategory, Notice } from '@/clients/manager'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  variant?: 'alarm' | 'alert'
  title?: string
}>()

const itemsPerPage = ref(10)
const items = ref<Notice[]>()
const alert = ref<Alert>({ on: false })
const days = ref(7)
const daysOptions = [1, 3, 7, 14, 30, 60, 90, 120, 180, 270, 365].map(
  (days) => ({
    title: `${days}`,
    value: days,
  })
)
const deleteDialog = ref(false)
const loadOptions = ref()
const loading = ref<boolean>(false)
const totalItems = ref(0)
const { isSysAdmin } = storeToRefs(useUserStore())

const headers = ref([
  { title: 'ID', key: 'id', value: (item: any) => shortID(item.id) },
  {
    title: 'Created At',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt * 1000),
  },
  { title: 'State', key: 'state' },
  { title: 'Level', key: 'level' },
  { title: 'Type', key: 'type' },
  {
    title: 'Message',
    key: 'message',
  },
  {
    title: 'History',
    key: 'data-table-expand',
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const sysAdminViewHeaders = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  ...headers.value,
] as const)

function shortID(id?: string): string | undefined {
  return `${id?.substring(0, 13)}...`
}
function shortMessage(message?: string): string | undefined {
  const m = messageJson(message)
  if (m) {
    return m.message.substring(0, 12) + '...'
  }
  return message?.substring(0, 12) + '...'
}
function messageJson(message?: string) {
  if (message) {
    try {
      return JSON.parse(message)
    } catch (e) {
      //console.log('failed to parse message', message)
    }
  }
}
async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  console.log('Loading notice items', options)
  const ret = await tryRequest(async () => {
    /**
     * Get user notice message list. Admin user lists all messages of tenant and non-admin user can only list own messages.
     * @summary get alert or alarm notice messages
     * @param {NoticeCategory} category
     * @param {Array<string>} requestBody id list
     * @param {NoticeType} [type]
     * @param {number} [startTime]
     * @param {number} [endTime]
     * @param {string} [userID]
     * @param {NoticeLevel} [level]
     * @param {NoticeState} [state]
     * @param {string} [contain] typically used to filter any field that contains a string
     * @param {string} [filterBy] filter by which field name
     * @param {string} [filterValue] filter with the value of the field
     * @param {string} [sortBy]
     * @param {string} [sortDesc]
     * @param {number} [page]
     * @param {number} [pageSize]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    const ret = await userAPI.listNotice(
      props.variant === 'alarm' ? NoticeCategory.Alarm : NoticeCategory.Alert,
      [], // id list
      undefined, // type
      undefined, // start time
      undefined, // end time
      undefined, // user id
      undefined, // level
      undefined, // state
      undefined, // contain
      options?.filterBy, // filter by
      options?.filterValue, // filter value
      options?.sortBy[0]?.key, // sort by
      options?.sortBy[0]?.order, // sort desc
      options?.page,
      options?.itemsPerPage
    )
    console.log('Loaded notice items', ret)
    totalItems.value = ret.data.total ?? 0
    items.value = ret.data.list ?? []
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function deleteNotice() {
  try {
    deleteDialog.value = false
    loading.value = true
    const ret = await tryRequest(async () => {
      await userAPI.deleteNotices(
        props.variant === 'alarm' ? NoticeCategory.Alarm : NoticeCategory.Alert,
        [],
        days.value
      )
      newToast({
        on: true,
        color: 'green',
        text: `Successfully deleted ${props.variant}s older than ${days.value} days`,
      })
      await loadItems(loadOptions.value)
    })
    if (ret) {
      alert.value = ret
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadItems(loadOptions.value)
})
</script>

<template>
  <Alert v-model="alert"></Alert>
  <v-row v-if="totalItems > 0" class="mx-2 my-2">
    <v-col cols="12" sm="6">
      <v-row
        ><v-chip size="large">{{ capitalize(variant ?? '') }}</v-chip>
        <RefreshButton @refresh="loadItems(loadOptions)" />
      </v-row>
    </v-col>
    <v-col cols="12" sm="6">
      <v-row justify="end">
        <v-btn
          v-if="variant == 'alarm'"
          class="mx-2"
          @click="deleteDialog = true"
          >Delete Old Alarms</v-btn
        >
        <v-select
          v-if="variant == 'alarm'"
          v-model="days"
          variant="plain"
          :items="daysOptions"
          :menu-props="{ class: 'text-right' }"
          class="mx-2 text-right"
          style="max-width: 100px"
          hide-details
          density="compact"
        >
          <template v-slot:label>
            <div class="text-right">Days to keep</div>
          </template>
          <template v-slot:selection="{ item }">
            <div class="text-right">{{ item.value }}</div>
          </template>
        </v-select>
      </v-row>
    </v-col>
  </v-row>
  <v-data-table-server
    v-if="(items?.length ?? 0) > 0"
    v-model:items-per-page="itemsPerPage"
    :headers="isSysAdmin ? sysAdminViewHeaders : headers"
    :items="items"
    :items-length="totalItems"
    @update:options="loadItems"
  >
    <template v-slot:expanded-row="{ item }">
      <History :history="item.history"> </History>
    </template>
    <template v-slot:item.message="{ item }">
      <v-chip>
        <span>{{ shortMessage(item.message) }}</span>
        <v-menu class="mt-2" activator="parent">
          <v-card class="pt-4 px-2"
            ><v-card-item
              ><v-data-table
                v-if="messageJson(item.message)"
                :items="[messageJson(item.message)]"
                hide-default-footer
              >
                <template v-slot:bottom></template></v-data-table
              ><v-card v-else variant="plain" max-width="300"
                ><v-card-text> {{ item.message }}</v-card-text></v-card
              ></v-card-item
            ></v-card
          >
        </v-menu>
      </v-chip></template
    >
  </v-data-table-server>
  <ConfirmDialog
    v-model="deleteDialog"
    :text="`Delete ${variant}s older than ${days} days?`"
    okText="Delete"
    okColor="red"
    @ok="deleteNotice"
  />
</template>
