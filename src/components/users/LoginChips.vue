<script setup lang="ts">
import { UserLogin } from '@/clients/manager/api'
defineProps<{ logins: Array<UserLogin> }>()
</script>
<template>
  <v-chip-group column
    ><v-chip v-for="n in logins" :key="n.login">
      <span>{{ n.login }}</span>
      <v-menu class="mt-2" activator="parent">
        <v-card class="p-2">
          <v-card-title>Sign in with {{ n.loginType }}</v-card-title>
          <v-data-table :items="[n]" hide-default-footer hide-default-header>
            <template v-slot:bottom></template
          ></v-data-table>
        </v-card>
      </v-menu> </v-chip
  ></v-chip-group>
</template>
