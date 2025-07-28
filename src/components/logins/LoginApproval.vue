<script setup lang="ts">
defineProps<{
  approvalState?: string
}>()
</script>

<template>
  <v-container>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="mx-auto pa-4" variant="text">
          <v-card-title class="text-h5 text-center mb-4">
            Account Pending Approval
          </v-card-title>

          <v-card-text class="text-center">
            <v-alert
              color="info"
              variant="tonal"
              class="mb-4"
            >
              Current Status: {{ approvalState || 'Pending' }}
            </v-alert>

            <p class="text-body-1 mb-4">
              Your account needs approval from your network administrator before you can access the system.
              Please contact your administrator to approve your account.
            </p>

            <p class="text-caption text-medium-emphasis">
              You will receive an email notification once your account has been approved.
            </p>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              color="primary"
              variant="text"
              to="/login"
            >
              Back to Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
