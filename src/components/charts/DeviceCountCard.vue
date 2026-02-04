<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { mdiDevices } from '@mdi/js'
</script>
<template>
  <AbstractCountCard
    :icon="mdiDevices"
    variant="device"
    addOnline
  ></AbstractCountCard>
</template>
