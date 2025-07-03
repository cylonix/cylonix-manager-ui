<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { FwConfig } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supFwAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const defaultInterface = ref('')
const form = ref<InstanceType<typeof VForm>>()
const hostAddr = ref('')
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')

const ready = computed(() => {
  return isFormValid.value
})

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    const input = <FwConfig>{
      name: name.value,
      hostAddr: hostAddr.value,
      defaultInterface: defaultInterface.value,
    }
    await supFwAPI().createFw(input)
    newToast({
      on: true,
      color: 'green',
      text: `Added firewall ${name.value} successfully`,
    })
    // Remove dialog after success.
    console.log('fw config:', input)
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
    title="Add firewall"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col sm="12" lg="6">
            <NameInput v-model="name" label="Firewall name"></NameInput>
          </v-col>
          <v-col sm="12" lg="6">
            <NameInput v-model="hostAddr" label="Host IP address"></NameInput>
            <NameInput
              v-model="defaultInterface"
              label="Default interface name"
            ></NameInput>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
