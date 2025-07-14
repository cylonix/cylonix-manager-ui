<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const links = [
  {
    title: 'Privacy Policy',
    route: '/privacy-policy',
  },
  {
    title: 'Terms of Service',
    route: '/terms-of-service',
  },
]
</script>

<template>
  <v-container class="fill-height">
    <v-card class="mx-auto" max-width="800" variant="flat">
      <v-card-text>
        <v-row justify="center" align="center">
          <v-col cols="12" class="text-center">
            <v-avatar size="144" color="grey-lighten-2" class="mb-4">
              <v-img src="@/assets/logo.png" alt="Cylonix"></v-img>
            </v-avatar>

            <h1 class="text-h4 mb-2">Cylonix</h1>

            <p class="text-body-1 text-grey-darken-1 mx-6 mb-6 text-center">
              Cylonix provides open source secure access service edge solutions.
              It uses WireGuard® technology as the mesh service, leveraging the
              Tailscale® design. For edge WireGuard® aggregation nodes, it
              offers Cilium® based firewall services and VPP-based software
              defined WAN routing. The platform includes a Kubernetes-based open
              source deployment system.
            </p>

            <v-row justify="center" class="mb-6">
              <v-col cols="auto" v-for="link in links" :key="link.title">
                <v-btn
                  variant="text"
                  color="primary"
                  @click="router.push(link.route)"
                >
                  {{ link.title }}
                </v-btn>
              </v-col>
            </v-row>

            <p class="text-caption text-grey-darken-1 mx-6 text-center">
              WireGuard is a registered trademark of Jason A. Donenfeld.
              Tailscale is a registered trademark of Tailscale Inc. Cilium is a
              registered trademark of Isovalent Inc. All other trademarks are
              property of their respective owners.
            </p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
