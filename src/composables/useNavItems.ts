// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  mdiAccountMultipleOutline,
  mdiApps,
  mdiAxisYArrowLock,
  mdiCogOutline,
  mdiDevices,
  mdiDomainPlus,
  mdiInformationOutline,
  mdiKeyChain,
  mdiLabelMultipleOutline,
  mdiLockOutline,
  mdiMessageBadgeOutline,
  mdiMonitorDashboard,
  mdiRoutes,
  mdiServerNetwork,
  mdiVpn,
  mdiWan,
} from '@mdi/js'
import { useUserStore } from '@/stores/user'

export type RoleGate =
  | 'any'
  | 'loggedIn'
  | 'isAdmin'
  | 'isSysAdmin'
  | 'isNetworkAdmin'
  | 'isNetworkAdminOnly'
  | 'nonAdmin'

export interface NavItem {
  path: string
  title: string
  icon?: string
  keywords?: string[]
  group?: string
  gate: RoleGate
}

export const navItems: NavItem[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: mdiMonitorDashboard,
    gate: 'isAdmin',
    keywords: ['home', 'overview'],
  },
  {
    path: '/tenant-approvals',
    title: 'Tenant approvals',
    icon: mdiMessageBadgeOutline,
    group: 'Approvals',
    gate: 'isSysAdmin',
  },
  {
    path: '/user-approvals',
    title: 'User approvals',
    icon: mdiMessageBadgeOutline,
    group: 'Approvals',
    gate: 'isAdmin',
  },
  {
    path: '/device-approvals',
    title: 'Device approvals',
    icon: mdiMessageBadgeOutline,
    group: 'Approvals',
    gate: 'loggedIn',
  },
  {
    path: '/approvals',
    title: 'All approvals',
    icon: mdiMessageBadgeOutline,
    group: 'Approvals',
    gate: 'isAdmin',
  },
  {
    path: '/tenants',
    title: 'Tenants',
    icon: mdiDomainPlus,
    gate: 'isAdmin',
  },
  {
    path: '/users',
    title: 'User management',
    icon: mdiAccountMultipleOutline,
    gate: 'isAdmin',
    keywords: ['users', 'accounts'],
  },
  {
    path: '/admin-users',
    title: 'Admin users',
    icon: mdiAccountMultipleOutline,
    group: 'Users',
    gate: 'isSysAdmin',
  },
  {
    path: '/regular-users',
    title: 'Regular users',
    icon: mdiAccountMultipleOutline,
    group: 'Users',
    gate: 'isSysAdmin',
  },
  {
    path: '/custom-auth-providers',
    title: 'Custom auth providers',
    icon: mdiAccountMultipleOutline,
    group: 'Users',
    gate: 'isSysAdmin',
    keywords: ['oauth', 'oidc', 'sso', 'identity'],
  },
  {
    path: '/ui/sup/namespace-instances',
    title: 'Namespace instances',
    icon: mdiWan,
    group: 'POPs',
    gate: 'isSysAdmin',
  },
  {
    path: '/ui/sup/fws',
    title: 'Firewalls',
    icon: mdiWan,
    group: 'POPs',
    gate: 'isSysAdmin',
    keywords: ['fw', 'firewall'],
  },
  {
    path: '/ui/sup/pops',
    title: 'Routing gateways',
    icon: mdiWan,
    group: 'POPs',
    gate: 'isSysAdmin',
    keywords: ['pop', 'gateway', 'router'],
  },
  {
    path: '/ui/sup/wgs',
    title: 'WireGuard gateways (supervisor)',
    icon: mdiWan,
    group: 'POPs',
    gate: 'isSysAdmin',
    keywords: ['wireguard', 'wg', 'supervisor'],
  },
  {
    path: '/ui/vpn-nodes',
    title: 'Machines',
    icon: mdiDevices,
    gate: 'nonAdmin',
    keywords: ['devices', 'nodes'],
  },
  {
    path: '/ui/vpn-users',
    title: 'VPN users',
    icon: mdiAccountMultipleOutline,
    group: 'VPN',
    gate: 'isAdmin',
  },
  {
    path: '/ui/vpn-nodes',
    title: 'VPN nodes',
    icon: mdiDevices,
    group: 'VPN',
    gate: 'isAdmin',
    keywords: ['machines', 'hosts'],
  },
  {
    path: '/ui/vpn-routes',
    title: 'VPN routes',
    icon: mdiRoutes,
    group: 'VPN',
    gate: 'isNetworkAdmin',
  },
  {
    path: '/ui/vpn-pre-auth-keys',
    title: 'Pre-auth keys',
    icon: mdiKeyChain,
    group: 'VPN',
    gate: 'isAdmin',
    keywords: ['auth', 'token'],
  },
  {
    path: '/ui/vpn-api-keys',
    title: 'API keys',
    icon: mdiKeyChain,
    group: 'VPN',
    gate: 'isAdmin',
  },
  {
    path: '/ui/vpn-user-keys',
    title: 'Auth keys',
    icon: mdiKeyChain,
    gate: 'loggedIn',
  },
  {
    path: '/ui/vpn-wg-servers',
    title: 'WireGuard servers',
    icon: mdiServerNetwork,
    gate: 'loggedIn',
    keywords: ['wireguard', 'wg'],
  },
  {
    path: '/ui/vpn-wg-devices',
    title: 'WireGuard devices',
    icon: mdiDevices,
    group: 'VPN',
    gate: 'isAdmin',
  },
  {
    path: '/ui/vpn-wg-nodes',
    title: 'WireGuard gateways',
    icon: mdiServerNetwork,
    group: 'VPN',
    gate: 'isAdmin',
  },
  {
    path: '/devices',
    title: 'Devices management',
    icon: mdiDevices,
    gate: 'isAdmin',
  },
  {
    path: '/labels',
    title: 'Labels',
    icon: mdiLabelMultipleOutline,
    gate: 'isAdmin',
    keywords: ['tags'],
  },
  {
    path: '/policies',
    title: 'Access control policies',
    icon: mdiAxisYArrowLock,
    gate: 'isAdmin',
    keywords: ['acl', 'policy', 'rules', 'firewall'],
  },
  {
    path: '/policies',
    title: 'Access controls',
    icon: mdiLockOutline,
    gate: 'isNetworkAdminOnly',
    keywords: ['acl', 'policy', 'rules'],
  },
  {
    path: '/apps',
    title: 'Apps',
    icon: mdiApps,
    gate: 'isAdmin',
  },
  {
    path: '/delete-account',
    title: 'Delete account',
    icon: mdiCogOutline,
    group: 'Settings',
    gate: 'nonAdmin',
  },
  {
    path: '/about',
    title: 'About',
    icon: mdiInformationOutline,
    gate: 'any',
  },
  {
    path: '/vpn',
    title: 'VPN',
    icon: mdiVpn,
    gate: 'isAdmin',
    keywords: ['group'],
    // Synthetic entry so palette surfaces the VPN group header.
  },
]

export function useNavItems() {
  const store = useUserStore()
  const { isAdmin, isNetworkAdmin, isSysAdmin, loggedIn } = storeToRefs(store)

  const visibleItems = computed<NavItem[]>(() => {
    return navItems.filter((item) => {
      switch (item.gate) {
        case 'any':
          return true
        case 'loggedIn':
          return loggedIn.value
        case 'isAdmin':
          return isAdmin.value
        case 'isSysAdmin':
          return isSysAdmin.value
        case 'isNetworkAdmin':
          return isNetworkAdmin.value
        case 'isNetworkAdminOnly':
          return isNetworkAdmin.value && !isAdmin.value
        case 'nonAdmin':
          return loggedIn.value && !isAdmin.value
        default:
          return false
      }
    })
  })

  return { visibleItems }
}
