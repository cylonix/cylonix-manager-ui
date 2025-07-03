<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

const emit = defineEmits(['load'])

const props = defineProps<{
  icon: string
  labels: Array<string>
  values: Array<Array<number>>
}>()

const option = computed(() => {
  return {
    xAxis: {
      data: props.labels,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {},
    series: series.value,
  }
})

const series = computed(() => {
  return props.values.map((v) => {
    return {
      data: v,
      type: 'line',
      smooth: true,
    }
  })
})
</script>
<template>
  <v-card class="mx-auto">
    <template v-slot:prepend>
      <v-icon
        color="indigo-lighten-2"
        class="me-8"
        :icon="icon"
        size="64"
        @click="emit('load')"
      ></v-icon>
    </template>

    <template v-slot:title>
      <slot name="title"></slot>
    </template>

    <template v-slot:append>
      <RefreshButton @click="emit('load')"></RefreshButton>
    </template>
    <v-chart style="width: 100%; height: 300px" :option="option" autoresize />
  </v-card>
</template>
