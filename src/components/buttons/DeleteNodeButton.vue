<script setup lang="ts">
import { ref } from 'vue'
import { V1Node } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

defineProps(['item'])
const alert = defineModel<Alert>('alert')
const emit = defineEmits(['deleted'])

const loading = ref(false)
const note = ref('')

async function deleteItem(item: V1Node) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteNode(item.id)
    emit('deleted', item)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted node ${item.name}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting node.')
  loading.value = false
}

function confirmDeleteText(item: V1Node): string {
  return `Delete device "${item.name}" of user ${item.user?.loginName}"?`
}
</script>
<template>
  <DeleteButton
    v-model:note="note"
    :confirmDeleteText="confirmDeleteText(item)"
    @delete="deleteItem(item)"
  >
  </DeleteButton>
</template>
