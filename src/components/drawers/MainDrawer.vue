<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
const drawer = defineModel<boolean>('drawer')
const opened = ref([])
const rail = ref(false)
const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, loggedIn } = storeToRefs(store)

function updateRail() {
  opened.value = [] // close all sub-groups.
}
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    expand-on-hover
    v-model:rail="rail"
    @update:rail="updateRail"
  >
    <v-list v-model:opened="opened" density="compact" nav>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-monitor-dashboard"
        title="Dashboard"
        to="/dashboard"
      >
      </v-list-item>
      <v-list-group v-if="isAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-message-badge-outline"
            title="Approvals"
          ></v-list-item>
        </template>
        <v-list-item
          v-if="isSysAdmin"
          title="Tenant approvals"
          to="/tenant-approvals"
        ></v-list-item>
        <v-list-item
          v-if="isAdmin"
          title="User approvals"
          to="/user-approvals"
        ></v-list-item>
        <v-list-item
          title="Device approvals"
          to="/device-approvals"
        ></v-list-item>
        <v-list-item
          v-if="isAdmin"
          title="All approvals"
          to="/approvals"
        ></v-list-item>
      </v-list-group>
      <v-list-item
        v-if="loggedIn && !isAdmin"
        prepend-icon="mdi-message-badge-outline"
        title="Device approvals"
        to="/device-approvals"
      ></v-list-item>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-domain-plus"
        title="Tenants"
        to="/tenants"
      ></v-list-item>
      <v-list-item
        v-if="!isSysAdmin && isAdmin"
        prepend-icon="mdi-account-multiple-outline"
        title="User Management"
        to="/users"
      ></v-list-item>
      <v-list-group v-if="isSysAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-account-multiple-outline"
            title="User Management"
          ></v-list-item>
        </template>
        <v-list-item title="Admin users" to="/admin-users"></v-list-item>
        <v-list-item title="Users" to="/regular-users"></v-list-item>
        <v-list-item title="All users" to="/users"></v-list-item>
      </v-list-group>
      <v-list-group v-if="isSysAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-wan"
            title="POPs"
          ></v-list-item>
        </template>
        <v-list-item
          title="Namespace instances"
          to="/ui/sup/namespace-instances"
        ></v-list-item>
        <v-list-item title="Firewalls" to="/ui/sup/fws"></v-list-item>
        <v-list-item title="Routing gateways" to="/ui/sup/pops"></v-list-item>
        <v-list-item title="WireGuard gateways" to="/ui/sup/wgs"></v-list-item>
      </v-list-group>
      <v-list-item
        v-if="isNetworkAdmin && !isAdmin"
        title="Users"
        prepend-icon="mdi-account-multiple-outline"
        to="/ui/vpn-users"
      ></v-list-item>
      <v-list-item
        v-if="loggedIn && !isAdmin"
        prepend-icon="mdi-devices"
        title="Machines"
        to="/ui/vpn-nodes"
      ></v-list-item>
      <v-list-item
        v-if="isNetworkAdmin && !isAdmin"
        prepend-icon="mdi-routes"
        title="Routes"
        to="/ui/vpn-routes"
      ></v-list-item>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-devices"
        title="Devices Management"
        to="/devices"
      ></v-list-item>
      <v-list-item
        v-if="isNetworkAdmin && !isAdmin"
        prepend-icon="mdi-lock-outline"
        title="Access Controls"
        to="/policies"
      ></v-list-item>
      <v-list-group v-if="isSysAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-vpn"
            title="VPN"
          ></v-list-item>
        </template>
        <v-list-item title="Users" to="/ui/vpn-users"></v-list-item>
        <v-list-item title="Nodes" to="/ui/vpn-nodes"></v-list-item>
        <v-list-item title="Routes" to="/ui/vpn-routes"></v-list-item>
        <v-list-item
          title="Pre-auth Keys"
          to="/ui/vpn-pre-auth-keys"
        ></v-list-item>
        <v-list-item title="API keys" to="/ui/vpn-api-keys"></v-list-item>
        <v-list-item
          title="WireGuard devices"
          to="/ui/vpn-wg-devices"
        ></v-list-item>
        <v-list-item
          v-if="isAdmin"
          title="WireGuard gateways"
          to="/ui/vpn-wg-nodes"
        ></v-list-item>
      </v-list-group>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-security"
        title="Firewall"
        to="/fw"
      ></v-list-item>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-label-multiple-outline"
        title="Labels"
        to="/labels"
      ></v-list-item>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-axis-y-arrow-lock"
        title="Policies"
        to="/policies"
      ></v-list-item>
      <v-list-item
        v-if="isAdmin"
        prepend-icon="mdi-application-outline"
        title="Applications"
        to="/apps"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-information-outline"
        title="About"
        to="/about"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
