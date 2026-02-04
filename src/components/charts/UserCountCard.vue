<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { mdiAccountOutline } from '@mdi/js'
</script>
<template>
  <AbstractCountCard
    :icon="mdiAccountOutline"
    variant="user"
    addOnline
  ></AbstractCountCard>
</template>
