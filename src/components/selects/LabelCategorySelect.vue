<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { LabelCategory } from '@/clients/manager/api'
const value = defineModel<LabelCategory>()
</script>
<template>
  <v-select
    v-model="value"
    :items="[LabelCategory.Policy, LabelCategory.Vpn]"
    item-title="name"
    item-value="name"
    :label="'Select label category'"
    chips
  >
    ></v-select
  >
</template>
