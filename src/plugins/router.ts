// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { createWebHistory, createRouter } from 'vue-router'

import About from '@/components/About.vue'
import AdminUsers from '@/components/users/AdminUsers.vue'
import Approvals from '@/components/Approvals.vue'
import Apps from '@/components/Apps.vue'
import ConfirmSession from '@/components/logins/ConfirmSession.vue'
import Dashboard from '@/components/Dashboard.vue'
import DeleteAccount from '@/components/settings/DeleteAccount.vue'
import Devices from '@/components/Devices.vue'
import DeviceApprovals from '@/components/approvals/DeviceApprovals.vue'
import Labels from '@/components/Labels.vue'
import Login from '@/components/Login.vue'
import LoginApproval from '@/components/logins/LoginApproval.vue'
import LoginError from '@/components/logins/LoginError.vue'
import NoService from '@/components/NoService.vue'
import OauthSuccess from '@/components/logins/OauthSuccess.vue'
import Policies from '@/components/Policies.vue'
import PrivacyPolicy from '@/components/terms/PrivacyPolicy.vue'
import RegularUsers from '@/components/users/RegularUsers.vue'
import SignUp from '@/components/SignUp.vue'
import SupervisorFwConfigs from '@/components/supervisor/SupervisorFwConfigs.vue'
import SupervisorPops from '@/components/supervisor/SupervisorPops.vue'
import SupervisorNamespaceInstances from '@/components/supervisor/SupervisorNamespaceInstances.vue'
import SupervisorWgNodes from '@/components/supervisor/SupervisorWgNodes.vue'
import Tenants from '@/components/Tenants.vue'
import TenantApprovals from '@/components/approvals/TenantApprovals.vue'
import TermsOfService from '@/components/terms/TermsOfService.vue'
import UserApprovals from '@/components/approvals/UserApprovals.vue'
import Users from '@/components/Users.vue'
import VpnApiKeys from '@/components/vpn/VpnApiKeys.vue'
import VpnNodes from '@/components/vpn/VpnNodes.vue'
import VpnNodeDetails from '@/components/vpn/VpnNodeDetails.vue'
import VpnPreAuthKeys from '@/components/vpn/VpnPreAuthKeys.vue'
import VpnRoutes from '@/components/vpn/VpnRoutes.vue'
import VpnUserKeys from '@/components/vpn/VpnUserKeys.vue'
import VpnUsers from '@/components/vpn/VpnUsers.vue'
import WebPrivacyPolicy from '@/components/terms/WebPrivacyPolicy.vue'
import WgDevices from '@/components/vpn/WgDevices.vue'
import WgNodes from '@/components/vpn/WgNodes.vue'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/about', component: About },
  { path: '/admin-users', component: AdminUsers },
  { path: '/approvals', component: Approvals, meta: { requiresAuth: true } },
  { path: '/apps', component: Apps, meta: { requiresAuth: true } },
  { path: '/confirm-session', component: ConfirmSession, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/delete-account', component: DeleteAccount, meta: { requiresAuth: true } },
  {
    path: '/delete-account-with-login',
    name: "delete-account-with-login",
    component: Login,
    props: (route: any) => ({
      redirect: '/delete-account',
    })
  },
  { path: '/devices', component: Devices, meta: { requiresAuth: true } },
  {
    path: '/device-approvals',
    component: DeviceApprovals,
    meta: { requiresAuth: true }
  },
  { path: '/labels', component: Labels, meta: { requiresAuth: true } },
  {
    path: '/login/:sessionID?',
    name: 'login',
    component: Login,
    props: true // Passing route params as props
  },
  {
    path: '/invite',
    name: 'invite',
    component: Login,
    props: (route: any) => ({
      inviteCode: route.query.code,
    })
  },
  {
    path: '/303/login/approval',
    name: 'login-approval',
    component: LoginApproval,
    props: (route: any) => ({
      approvalState: route.query.state,
    })
  },
  {
    path: '/303/login/error',
    name: 'login-error',
    component: LoginError,
    props: (route: any) => ({
      error: route.query.error,
    })
  },
  { path: '/no-service', component: NoService },
  {
    path: '/oauth-success/:sessionID?',
    name: 'oauth-success',
    component: OauthSuccess,
    props: true // Passing route params as props
  },
  { path: '/policies', component: Policies, meta: { requiresAuth: true } },
  { path: '/privacy-policy', component: PrivacyPolicy },
  { path: '/regular-users', component: RegularUsers, meta: { requiresAuth: true }  },
  { path: '/signup', component: SignUp },
  { path: '/tenants', component: Tenants, meta: { requiresAuth: true } },
  {
    path: '/tenant-approvals',
    component: TenantApprovals,
    meta: { requiresAuth: true }
  },
  { path: '/terms-of-service', component: TermsOfService },
  {
    path: '/user-approvals',
    component: UserApprovals,
    meta: { requiresAuth: true }
  },
  { path: '/users', component: Users, meta: { requiresAuth: true } },
  {
    path: '/ui/sup/fws',
    component: SupervisorFwConfigs,
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/wgs',
    component: SupervisorWgNodes,
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/pops',
    component: SupervisorPops,
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/namespace-instances',
    component: SupervisorNamespaceInstances,
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/vpn-api-keys',
    component: VpnApiKeys,
    meta: { requiresAuth: true }
  },
  { path: '/ui/vpn-nodes', component: VpnNodes, meta: { requiresAuth: true } },
  { path: '/ui/vpn-node-details', component: VpnNodeDetails, meta: { requiresAuth: true } },
  {
    path: '/ui/vpn-pre-auth-keys',
    component: VpnPreAuthKeys,
    meta: { requiresAuth: true }
  },
  { path: '/ui/vpn-routes', component: VpnRoutes, meta: { requiresAuth: true } },
  { path: '/ui/vpn-user-keys', component: VpnUserKeys, meta: { requiresAuth: true } },
  { path: '/ui/vpn-users', component: VpnUsers, meta: { requiresAuth: true } },
  {
    path: '/ui/vpn-wg-devices',
    component: WgDevices,
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/vpn-wg-nodes',
    component: WgNodes,
    meta: { requiresAuth: true }
  },
  { path: '/web-privacy-policy', component: WebPrivacyPolicy },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const store = useUserStore()

  if (to.meta && to.meta.requiresAuth && !store.loggedIn) {
    console.log('User not logged in, redirecting to login page from', from.path, '->', to.path)
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
  if (to.path == '/' && !store.isAdmin) {
    return {
      path: '/ui/vpn-nodes',
      query: { redirect: to.fullPath }
    }
  }
  return true
})

export default router
