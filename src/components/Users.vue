<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)
</script>
<template>
  <v-row>
    <v-col cols="12">
      <AdminUsers v-if="isSysAdmin"></AdminUsers>
    </v-col>
    <v-col cols="12">
      <RegularUsers></RegularUsers>
    </v-col>
  </v-row>
</template>
