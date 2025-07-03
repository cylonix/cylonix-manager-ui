<script setup lang="ts">
defineProps(['label', 'data'])
</script>
<template>
  <v-chip>
    <span>{{ label }}</span>
    <v-menu class="mt-2" activator="parent" open-on-hover>
      <v-card>
        <v-card-item
          ><v-data-table :items="[data]" hide-default-footer>
            <template v-slot:bottom></template></v-data-table
        ></v-card-item>
      </v-card>
    </v-menu>
  </v-chip>
</template>
