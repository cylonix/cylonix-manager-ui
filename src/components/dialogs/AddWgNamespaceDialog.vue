<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { WgNamespaceConfig } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supResourceAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const props = defineProps(['namespace', 'addPops'])
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const popNames = ref<Array<string>>([])

const ready = computed(() => {
  return isFormValid.value
})

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    await supResourceAPI().postOriginWgResource(props.namespace, <WgNamespaceConfig>{
      pops: popNames.value
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added '${popNames.value}' to '${props.namespace}' successfully`
    })
    // Remove dialog after success.
    dialog.value = false
    emit('added')
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>

<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    maxWidth="1000"
    :minWidth="lgAndUp ? '900' : '400'"
    :okDisabled="!ready"
    okText="Add"
    :title="`Add pop to ${namespace}`"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-chip-group
          v-model="popNames"
          selected-class="text-primary"
          column
          mandatory
          multiple
        >
          <v-chip v-for="pop in addPops" :key="pop" :text="pop"></v-chip>
        </v-chip-group>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
