<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { FwConfig, PopInstance } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supFwAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const props = defineProps<{
  addFws: Array<FwConfig>
  namespace: string
  addPops: Array<PopInstance>
}>()
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const selectedFw = ref<number>()
const selectedPop = ref<number>()

const ready = computed(() => {
  return selectedFw.value != undefined && selectedPop.value != undefined
})

async function add() {
  const fw = props.addFws.find(
    (_: any, index: number) => selectedFw.value == index
  )
  const pop = props.addPops.find(
    (_: any, index: number) => selectedPop.value == index
  )
  if (!fw) {
    alert.value = <Alert>{
      on: true,
      text: 'Please select a firewall to apply.',
    }
    return
  }
  if (!pop) {
    alert.value = <Alert>{
      on: true,
      text: 'Please select a pop for the firewall to connect to.',
    }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await supFwAPI().updateFw(fw.id ?? '', <FwConfig>{
      pop: pop.name,
      tenant: props.namespace,
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added '${fw.name}' to '${props.namespace}' successfully`,
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
        <v-card-title>Please select the firewall to add</v-card-title>
        <v-chip-group
          class="mx-2 my-2"
          v-model="selectedFw"
          selected-class="text-primary"
          column
          mandatory
        >
          <v-chip v-for="n in addFws" filter :text="n.name"></v-chip>
        </v-chip-group>
        <v-card-title
          >Please select the pop the firewall will connect to</v-card-title
        >
        <v-chip-group
          class="mx-2 my-2"
          v-model="selectedPop"
          selected-class="text-primary"
          column
          mandatory
        >
          <v-chip v-for="n in addPops" filter :text="n.name"></v-chip>
        </v-chip-group>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
