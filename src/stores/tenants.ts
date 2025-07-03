import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TenantConfig } from '@/clients/manager/api'

export const useTenantsStore = defineStore('tenants', () => {
  const tenants = ref<Map<string, TenantConfig>>(new Map())
  function $reset () {
    tenants.value.clear()
  }
  function get (namespace: string) {
    return tenants.value.get(namespace)
  }
  function set (t: TenantConfig) {
    tenants.value.set(t.namespace, t)
  }

  return { $reset, get, set, tenants }
})
