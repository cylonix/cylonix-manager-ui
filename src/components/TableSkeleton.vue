<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
  }>(),
  {
    rows: 6,
    columns: 5,
  },
)
</script>

<template>
  <tr v-for="r in rows" :key="r" class="skeleton-row">
    <td v-for="c in columns" :key="c">
      <div
        class="skeleton-cell"
        :style="{ width: `${40 + ((r * c * 17) % 45)}%` }"
      />
    </td>
  </tr>
</template>

<style scoped>
.skeleton-row td {
  padding: 12px 16px;
}

.skeleton-cell {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 0%,
    rgba(var(--v-theme-on-surface), 0.14) 40%,
    rgba(var(--v-theme-on-surface), 0.06) 80%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
