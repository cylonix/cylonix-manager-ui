<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()

function toggleTheme() {
  theme.change(theme.global.current.value.dark ? 'light' : 'dark')
}
</script>
<template>
  <v-btn class="mx-2" @click="toggleTheme" icon="mdi-theme-light-dark"></v-btn>
</template>
