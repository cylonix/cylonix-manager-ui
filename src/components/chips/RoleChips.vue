<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, PredefinedRoles } from '@/clients/manager/api'

const emit = defineEmits(['add', 'delete'])
const role = defineModel<String>()
const props = defineProps<{
  user?: User
}>()

const dialog = ref(false)
const dialogTitle = ref('')
const event = ref<'add' | 'delete'>('delete')
const allRoles = [
  PredefinedRoles.NetworkAdmin,
  PredefinedRoles.NetworkOwner,
  PredefinedRoles.NamespaceAdmin,
]
const addRoles = computed(() => {
  const add = allRoles.filter((l) => {
    return !(props.user?.roles?.some((l1) => l1 == l) ?? false)
  })
  console.log(props.user?.displayName, 'addRoles', add)
  return add
})

function deleteRole(v: String) {
  role.value = v
  emit('delete')
}
function addRole(v: String) {
  role.value = v
  event.value = 'add'
  dialog.value = true
  dialogTitle.value = 'Confirm to add role to user'
}
function confirmed() {
  emit(event.value)
  dialog.value = false
}
</script>

<template>
  <v-container class="py-0" v-if="(user?.roles?.length ?? 0) > 0" max-width="300px"
    ><v-chip
      class="d-flex justify-end"
      variant="text"
      v-for="n in user?.roles!"
      :key="n"
    >
      <template v-slot:append>
        <DeleteButton
          title="Confirm to delete role from user"
          @delete="deleteRole(n)"
        >
          <template v-slot:delete-dialog>
            <p>Are you sure you want to delete this role?</p>
            <p>Role: {{ n }}</p>
          </template>
        </DeleteButton>
      </template>
      <span>{{ n }}</span>
    </v-chip>
  </v-container>
  <v-container class="py-0 d-flex justify-center" v-if="(addRoles?.length ?? 0) > 0">
    <v-menu>
      <template v-slot:activator="{ props: menu }">
        <AddButton label="Add role" :parent-props="menu" />
      </template>
      <v-card class="px-3 py-3">
        <v-card-title>Select a role to add</v-card-title>
        <v-card-item>
          <v-chip
            class="mx-1 px-2 py-1"
            v-for="n in addRoles"
            :key="n"
            size="large"
            @click="addRole(n)"
          >
            <span>{{ n }}</span>
          </v-chip></v-card-item
        ></v-card
      >
    </v-menu>
  </v-container>
  <ConfirmDialog v-model="dialog" :title="dialogTitle" @ok="confirmed"
    ><template v-slot:item>
      <p>Are you sure you want to add this role to {{ user?.displayName }}?</p>
      <p>Role: {{ role }}</p>
    </template>
  </ConfirmDialog>
</template>
