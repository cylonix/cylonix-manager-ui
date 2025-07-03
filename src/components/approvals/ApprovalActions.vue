<script setup lang="ts">
import { ref } from 'vue'
import { ApprovalState } from '@/clients/manager/api'
const emit = defineEmits([
  'delete',
  'approve',
  'reject',
  'pre-approve',
  'pre-delete',
  'pre-reject',
])
const note = defineModel<string>('note')
defineProps([
  'confirmApproveText',
  'confirmDeleteText',
  'confirmRejectText',
  'loading',
  'noDelete',
  'noApprove',
  'noReject',
  'okApproveDisabled',
  'okDeleteDisabled',
  'okRejectDisabled',
  'state',
])
const deleteDialog = ref(false)
const approveDialog = ref(false)
const rejectDialog = ref(false)
function clickApprove() {
  emit('pre-approve')
  approveDialog.value = true
}
function clickDelete() {
  emit('pre-delete')
  deleteDialog.value = true
}
function clickReject() {
  emit('pre-reject')
  rejectDialog.value = true
}
function okApprove() {
  emit('approve')
  approveDialog.value = false
}
function okDelete() {
  emit('delete')
  deleteDialog.value = false
}
function okReject() {
  emit('reject')
  rejectDialog.value = false
}
</script>
<template>
  <v-icon
    v-if="!noDelete"
    class="me-2"
    color="red"
    size="small"
    @click="clickDelete"
  >
    mdi-delete-outline
  </v-icon>
  <v-icon
    v-if="!noApprove && state != ApprovalState.Approved"
    class="me-2"
    color="green"
    size="small"
    @click="clickApprove"
  >
    mdi-thumb-up-outline
  </v-icon>
  <v-icon
    v-if="
      !noReject &&
      state != ApprovalState.Rejected &&
      state != ApprovalState.Approved
    "
    size="small"
    @click="clickReject"
  >
    mdi-thumb-down-outline
  </v-icon>
  <ConfirmDialog
    v-model="deleteDialog"
    :loading="loading"
    :okDisabled="okDeleteDisabled || !note"
    :text="confirmDeleteText ?? 'Delete this request'"
    @ok="okDelete"
    ><template v-slot:item>
      <slot name="delete-dialog"></slot>
      <NoteInput v-model="note" label="Deletion note" /> </template
  ></ConfirmDialog>
  <ConfirmDialog
    v-model="approveDialog"
    :loading="loading"
    :okDisabled="okApproveDisabled || !note"
    :text="confirmApproveText ?? 'Approve this request'"
    @ok="okApprove"
    ><template v-slot:item>
      <slot name="approve-dialog"></slot>
      <NoteInput v-model="note" label="Approval note" /> </template
  ></ConfirmDialog>
  <ConfirmDialog
    v-model="rejectDialog"
    :loading="loading"
    :okDisabled="okRejectDisabled || !note"
    :text="confirmRejectText ?? 'Reject this request'"
    @ok="okReject"
    ><template v-slot:item>
      <slot name="reject-dialog"></slot>
      <NoteInput v-model="note" label="Rejection note" /> </template
  ></ConfirmDialog>
</template>
