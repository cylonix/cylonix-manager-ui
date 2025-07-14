<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import {
  IPRoute,
  IPRouteCreateInput,
  PopInstance,
} from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supRouteAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const props = defineProps<{
  namespace: string
  pop?: PopInstance
  allPops: Array<string>
}>()
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const dest = ref('')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const toPop = ref(0)
const via = ref('')

const ready = computed(() => {
  return isFormValid.value
})

const toPopNames = computed(() => {
  return props.allPops.filter((p) => p != props.pop?.name)
})

/*
// IPRoute:
{
	"dest":"0.0.0.0/0",
	"dev":"loop_115_mesh_pop-bj-18_and_pop-ca-17",
	"via":"10.6.14.5",
	"vrf":115
}
*/

async function add() {
  const popID = props.pop?.id
  if (!popID) {
    alert.value = <Alert>{
      on: true,
      text: 'pop is not set',
    }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    const vrf = props.pop?.vrf
    const dev = `loop_${vrf}_mesh_${props.pop?.name}_and_${
      toPopNames.value[toPop.value]
    }`
    await supRouteAPI().createNamespaceRoute(props.namespace, popID, <
      IPRouteCreateInput
    >{
      routes: [
        <IPRoute>{
          dest: dest.value,
          dev: dev,
          via: via.value,
          vrf: vrf,
        },
      ],
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added route ${dest.value} -> ${via.value} successfully.`,
    })
    // Remove dialog after success.
    dialog.value = false
    emit('added')
  })
  if (ret) {
    console.log('ret=', ret)
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
    :title="`Add route to ${namespace}`"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert" class="my-2"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col :md="4" cols="12">
            <NameInput
              v-model="dest"
              label="Destination e.g. 0.0.0.0/0"
              required
            ></NameInput>
            <NameInput
              v-model="via"
              label="Next hop address e.g. 10.6.14.5"
              required
            ></NameInput>
          </v-col>
          <v-col :md="8" cols="12" align="start">
            <v-chip class="mb-2" size="large" variant="text"
              >Select next hop pop</v-chip
            >
            <v-chip-group v-model="toPop" mandatory column>
              <v-chip class="mx-2" v-for="p in toPopNames" filter>{{
                p
              }}</v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
