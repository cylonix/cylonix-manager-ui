<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ password: string, size?: string }>()
const hidden = ref(true)
const text = computed(() => {
    console.log("old text=", text.value)
    return hidden.value ? '* * * * * * * (Click to reveal)' : props.password
})
function click() {
    hidden.value = !hidden.value
    if (!hidden.value) {
        setTimeout(() => {
            hidden.value = true
        }, 10000 /* 10 seconds */)
    }
}
</script>
<template>
  <v-chip @click="click" :size="size" variant="plain">
    <span>{{ text }}</span>
  </v-chip>
</template>
