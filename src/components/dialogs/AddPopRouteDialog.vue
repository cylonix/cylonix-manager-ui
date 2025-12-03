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
  allPops: Array<PopInstance>
}>()
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const dest = ref('')
const viaInput = ref('')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const toPop = ref<number | undefined>()
const toNat = ref<number | undefined>()

const ready = computed(() => {
  return (
    isFormValid.value &&
    (toPop.value !== undefined || toNat.value !== undefined) &&
    ((toPop.value !== undefined && toPop.value >= 0) ||
      (toNat.value !== undefined && toNat.value >= 0)) &&
    dest.value.trim() !== ''
  )
})

const toPops = computed(() => {
  return props.allPops.filter((p) => p.name != props.pop?.name)
})
const toPopNames = computed(() => {
  const names: Array<string> = []
  toPops.value.forEach((p) => names.push(p.name))
  return names
})

/*
// IPRoute:
{
	"dest":"0.0.0.0/0",
	"dev":"loop_115_mesh_pop-ny-18_and_pop-ca-17",
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
  if (toPop.value === undefined && toNat.value === undefined) {
    alert.value = <Alert>{
      on: true,
      text: 'Please select a next hop pop or nat.',
    }
    return
  }
  var dev: string | undefined = undefined
  var via: string | undefined = undefined
  if (toPop.value !== undefined) {
    const to = toPops.value[toPop.value]
    if (!to) {
      alert.value = <Alert>{
        on: true,
        text: 'next hop pop is not found',
      }
      return
    }
    for (const v of props.pop?.bvis ?? []) {
      if (!v.loop?.name.includes(to.name)) {
        continue
      }
      dev = v.loop?.name
      break
    }
    for (const v of to.bvis ?? []) {
      if (!v.loop?.name.includes(props.pop?.name ?? '')) {
        continue
      }
      via = v.loop?.cidr[0]?.split('/')[0]
      break
    }
    if (!dev || !via) {
      console.log('dev or via is not found:', dev, via)
      alert.value = <Alert>{
        on: true,
        text: `Cannot find BVI for next hop pop ${to}.`,
      }
      return
    }
  }
  if (toNat.value !== undefined) {
    const nat = props.pop?.nats ? props.pop.nats[toNat.value] : undefined
    if (!nat) {
      alert.value = <Alert>{
        on: true,
        text: 'next hop nat is not found',
      }
      return
    }
    dev = nat.name
    via = viaInput.value
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    const vrf = props.pop?.vrf
    await supRouteAPI().createNamespaceRoute(props.namespace, popID, <
      IPRouteCreateInput
    >{
      routes: [
        <IPRoute>{
          dest: dest.value,
          dev: dev,
          via: via,
          vrf: vrf,
        },
      ],
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added route ${dest.value} -> ${via} successfully.`,
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
    ><template class="mt-4" v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form class="mt-4" ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col :md="4" cols="12">
            <NameInput
              v-model="dest"
              label="Destination e.g. 0.0.0.0/0"
              required
            ></NameInput>
            <NameInput
              v-model="viaInput"
              label="Next hop IP address e.g. 10.6.14.5"
            ></NameInput>
          </v-col>
          <v-col :md="8" cols="12" align="start">
            <v-chip class="mb-2" size="large" variant="text"
              >Select next hop pop or a nat interface</v-chip
            >
            <v-chip-group v-model="toPop" column>
              <v-chip class="mx-2" v-for="p in toPopNames" filter>{{
                p
              }}</v-chip>
            </v-chip-group>
            <v-chip-group v-if="pop?.nats" v-model="toNat" column>
              <v-chip class="mx-2" v-for="n in pop?.nats" filter>{{
                n.name
              }}</v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
