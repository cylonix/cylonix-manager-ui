<script setup lang="ts">
defineProps<{
  error?: string
}>()
</script>

<template>
  <v-container>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="mx-auto pa-4" variant="text">
          <v-card-title class="text-h5 text-center text-error mb-4">
            Login Error
          </v-card-title>

          <v-card-text class="text-center">
            <p class="text-body-1 mb-4">{{ error || 'An unknown error occurred during login' }}</p>

            <v-btn
              color="primary"
              variant="text"
              to="/login"
              class="mt-4"
            >
              Return to Login
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
