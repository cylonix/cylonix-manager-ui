// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { createWebHistory, createRouter, type RouteLocationNormalized } from 'vue-router'

// Components are lazy-loaded in route definitions below to enable code-splitting.
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', component: () => import('@/components/vpn/VpnNodes.vue'), meta: { requiresAuth: true } },
  { path: '/about', component: () => import('@/components/About.vue') },
  { path: '/add-custom-auth', component: () => import('@/components/logins/AddCustomAuth.vue') },
  { path: '/add-custom-auth-success', component: () => import('@/components/logins/AddCustomAuthSuccess.vue'), meta: { requiresAuth: true } },
  { path: '/admin-users', component: () => import('@/components/users/AdminUsers.vue') },
  { path: '/approvals', component: () => import('@/components/Approvals.vue'), meta: { requiresAuth: true } },
  { path: '/apps', component: () => import('@/components/Apps.vue'), meta: { requiresAuth: true } },
  { path: '/confirm-session', component: () => import('@/components/logins/ConfirmSession.vue'), meta: { requiresAuth: true } },
  { path: '/custom-auth-providers', component: () => import('@/components/logins/CustomAuth.vue'), meta: { requiresAuth: true } },
  { path: '/dashboard', component: () => import('@/components/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/delete-account', component: () => import('@/components/settings/DeleteAccount.vue'), meta: { requiresAuth: true } },
  {
    path: '/delete-account-with-login',
    name: "delete-account-with-login",
    component: () => import('@/components/Login.vue'),
    props: (route: RouteLocationNormalized) => ({
      redirect: '/delete-account',
    })
  },
  { path: '/devices', component: () => import('@/components/Devices.vue'), meta: { requiresAuth: true } },
  {
    path: '/device-approvals',
    component: () => import('@/components/approvals/DeviceApprovals.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/labels', component: () => import('@/components/Labels.vue'), meta: { requiresAuth: true } },
  {
    path: '/login/:sessionID?',
    component: () => import('@/components/Login.vue'),
    props: (route: RouteLocationNormalized) => ({
      sessionID: route.params.sessionID,
      redirect: route.query.redirect,
    })
  },
  {
    path: '/invite',
    name: 'invite',
    component: () => import('@/components/Login.vue'),
    props: (route: RouteLocationNormalized) => ({
      inviteCode: route.query.code,
    })
  },
  {
    path: '/303/login/approval',
    name: 'login-approval',
    component: () => import('@/components/logins/LoginApproval.vue'),
    props: (route: RouteLocationNormalized) => ({
      approvalState: route.query.state,
    })
  },
  {
    path: '/303/login/error',
    name: 'login-error',
    component: () => import('@/components/logins/LoginError.vue'),
    props: (route: RouteLocationNormalized) => ({
      error: route.query.error,
    })
  },
  { path: '/no-service', component: () => import('@/components/NoService.vue') },
  {
    path: '/oauth-success/:sessionID?',
    name: 'oauth-success',
    component: () => import('@/components/logins/OauthSuccess.vue'),
    props: (route: RouteLocationNormalized) => ({
      sessionID: route.params.sessionID,
      redirect: route.query.redirect,
      inviteCode: route.query.inviteCode,
    })
  },
  { path: '/policies', component: () => import('@/heavy/Policies.vue'), meta: { requiresAuth: true } },
  { path: '/privacy-policy', component: () => import('@/components/terms/PrivacyPolicy.vue') },
  { path: '/regular-users', component: () => import('@/components/users/RegularUsers.vue'), meta: { requiresAuth: true } },
  { path: '/qr-code-sign-in/:url', component: () => import('@/components/logins/QRCodeSignIn.vue'), meta: { requiresAuth: false }, props: true },
  { path: '/signup', component: () => import('@/components/SignUp.vue') },
  { path: '/tenants', component: () => import('@/components/Tenants.vue'), meta: { requiresAuth: true } },
  {
    path: '/tenant-approvals',
    component: () => import('@/components/approvals/TenantApprovals.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/terms-of-service', component: () => import('@/components/terms/TermsOfService.vue') },
  {
    path: '/user-approvals',
    component: () => import('@/components/approvals/UserApprovals.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/users', component: () => import('@/components/Users.vue'), meta: { requiresAuth: true } },
  {
    path: '/ui/sup/fws',
    component: () => import('@/components/supervisor/SupervisorFwConfigs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/wgs',
    component: () => import('@/components/supervisor/SupervisorWgNodes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/pops',
    component: () => import('@/components/supervisor/SupervisorPops.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/sup/namespace-instances',
    component: () => import('@/components/supervisor/SupervisorNamespaceInstances.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/vpn-api-keys',
    component: () => import('@/components/vpn/VpnApiKeys.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/ui/vpn-nodes', component: () => import('@/components/vpn/VpnNodes.vue'), meta: { requiresAuth: true } },
  { path: '/ui/vpn-node-details/:nodeId', component: () => import('@/components/vpn/VpnNodeDetails.vue'), meta: { requiresAuth: true }, props: true },
  {
    path: '/ui/vpn-pre-auth-keys',
    component: () => import('@/components/vpn/VpnPreAuthKeys.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/ui/vpn-routes', component: () => import('@/components/vpn/VpnRoutes.vue'), meta: { requiresAuth: true } },
  { path: '/ui/vpn-user-keys', component: () => import('@/components/vpn/VpnUserKeys.vue'), meta: { requiresAuth: true } },
  { path: '/ui/vpn-users', component: () => import('@/components/vpn/VpnUsers.vue'), meta: { requiresAuth: true } },
  {
    path: '/ui/vpn-wg-devices',
    component: () => import('@/components/vpn/WgDevices.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/vpn-wg-nodes',
    component: () => import('@/components/vpn/WgNodes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ui/vpn-wg-servers',
    component: () => import('@/components/vpn/VpnWgServers.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/web-privacy-policy', component: () => import('@/components/terms/WebPrivacyPolicy.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('@/components/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const store = useUserStore()

  if (to.meta && to.meta.requiresAuth && !store.loggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
  if (to.path === '/' && !store.isAdmin) {
    return {
      path: '/ui/vpn-nodes',
      query: to.query
    }
  }
  if (to.path === '/' && store.isAdmin) {
    return {
      path: '/dashboard',
      query: to.query
    }
  }
  return true
})

export default router
