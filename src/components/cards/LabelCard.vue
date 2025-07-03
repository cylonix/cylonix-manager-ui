<script setup lang="ts">
defineProps(['label', 'variant'])
</script>

<template>
  <v-card class="my-4 py-4" :variant="variant">
    <v-card-title>Label {{ label.name }}</v-card-title>
    <v-card-item>
      <v-data-table :items="[label]" hide-default-footer>
        <template v-slot:item.color="{ item }">
          <v-avatar :color="item.color"></v-avatar>
        </template>
        <template v-slot:item.star="{ item }">
          <v-icon v-if="item.star" color="green" icon="mdi-star"></v-icon>
        </template>
        <template v-slot:bottom></template></v-data-table>
    </v-card-item>
  </v-card>
</template>
