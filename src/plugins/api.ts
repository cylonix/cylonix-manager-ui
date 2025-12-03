// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import axios, { AxiosError } from 'axios'
import { HttpStatusCode } from 'axios'
import {
  DeviceApi,
  LabelApi,
  LoginApi,
  OtpApi,
  TenantApi,
  UserApi,
  VpnApi
} from '@/clients/manager/api'
import { HeadscaleServiceApi } from '@/clients/headscale/api'
import { Configuration } from '@/clients/manager/configuration'
import {
  InstanceApi as SupInstanceAPI,
  PopApi as SupPopAPI,
  ResourceApi as SupResourceAPI,
  RouteApi as SupRouteAPI,
  FwApi as SupFwAPI,
  WgApi as SupWgAPI
} from '@/clients/supervisor/api'
import { camelizeKeys, decamelizeKeys } from '@cylonix/humps'
import { Alert } from '@/plugins/alert'
import { Toast, newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'
import getEnv from '@/utils/env'

export class UnauthorizedError extends Error {
  constructor(m: string) {
    super(m)

    // Set the prototype explicitly.
    // https://github.com/microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

function handleError(error: any): Alert | Toast {
  if (error instanceof UnauthorizedError) {
    return <Toast>{
      color: 'red',
      text: error.message
    }
  }
  if (error instanceof Error || error instanceof AxiosError) {
    return <Alert>{
      on: true,
      title: 'Error!',
      text: error.message,
      type: 'error'
    }
  }
  return <Alert>{
    on: true,
    title: 'Error!',
    text: error.toString(),
    type: 'error'
  }
}

export async function tryRequest(fn: () => any): Promise<Alert | undefined> {
  try {
    return await fn()
  } catch (e) {
    const ret = handleError(e)
    if ('color' in ret) {
      newToast(ret)
      return
    }
    console.error(ret)
    return ret
  }
}

const basePath = getEnv('VITE_BASE_URL')
console.log('base path:', basePath)
const config = new Configuration({
  baseOptions: {
    withCredentials: true
  }
})

function configWithAPIKey(): Configuration {
  const state = useUserStore()
  const supAPIKey = getEnv('VITE_SUP_API_KEY') ?? state.apiKey
  if (supAPIKey) {
    return new Configuration({
      apiKey: supAPIKey,
      baseOptions: {
        withCredentials: true
      }
    })
  }
  return config
}

const instance = axios.create({
  // No options
})

instance.interceptors.request.use(function (config: any) {
  if (config.headers['Content-Type'] === 'application/json') {
    if (config.data) {
      // Convert all api requests json data to snake_case.
      // Since vite already transformed data to json string, need to convert it
      // back to object first before de-camelizing the keys.
      const data = JSON.parse(config.data)
      config.data = JSON.stringify(decamelizeKeys(data))
    }
  }
  return config
})

instance.interceptors.response.use(
  function (response: any) {
    if (
      response.data &&
      response.headers['content-type'] === 'application/json'
    ) {
      response.data = camelizeKeys(response.data)
    }
    return response
  },
  function (error: any) {
    console.log('API error:', error)
    if (error && error.response) {
      console.log(error)
      // TODO: localize the error message based on the error code.
      let message = error.message
      const response = error.response
      if (response.status == HttpStatusCode.Unauthorized) {
        message +=
          '. Unauthorized. Please check your login credentials and re-try.'
        const store = useUserStore()
        store.$reset()
        return Promise.reject(new UnauthorizedError(message))
      } else if (response.data) {
        if (
          response.data &&
          response.headers['content-type'] === 'application/json'
        ) {
          response.data = camelizeKeys(response.data)
        }
        message += ': ' + JSON.stringify(response.data)
      }
      if (error instanceof AxiosError) {
        error.message = message
        return Promise.reject(error)
      }
      return Promise.reject(new Error(message))
    }
    return Promise.reject(error)
  }
)

// Manager APIs
export const deviceAPI = new DeviceApi(config, basePath, instance)
export const labelAPI = new LabelApi(config, basePath, instance)
export const loginAPI = new LoginApi(config, basePath, instance)
export const otpAPI = new OtpApi(config, basePath, instance)
export const tenantAPI = new TenantApi(config, basePath, instance)
export const userAPI = new UserApi(config, basePath, instance)
export const wgAPI = new VpnApi(config, basePath, instance)
export const axiosInstance = instance

// Supervisor APIs
export function supFwAPI() {
  return new SupFwAPI(configWithAPIKey(), '/supervisor/v1', instance)
}
export function supInstanceAPI() {
  return new SupInstanceAPI(configWithAPIKey(), '/supervisor/v1', instance)
}
export function supPopAPI() {
  return new SupPopAPI(configWithAPIKey(), '/supervisor/v1', instance)
}
export function supResourceAPI() {
  return new SupResourceAPI(configWithAPIKey(), '/supervisor/v1', instance)
}
export function supRouteAPI() {
  return new SupRouteAPI(configWithAPIKey(), '/supervisor/v1', instance)
}
export function supWgAPI() {
  return new SupWgAPI(configWithAPIKey(), '/supervisor/v1', instance)
}

// Headscale APIs
export const vpnAPI = new HeadscaleServiceApi(config, '/vpn', instance)
export interface NodeHealth {
  subsys: string | null
  error: string | null
}

export function parseNodeHealth(health: string | null): NodeHealth | undefined {
  if (!health) {
    return undefined
  }
  try {
    var parsed = JSON.parse(health)
    parsed.Error = parsed.Error.replace("Tailscale ", '❌ ')
    const s = JSON.stringify(decamelizeKeys(parsed))
    const ret = JSON.parse(s) as NodeHealth
    return ret
  } catch (e) {
    console.error('Failed to parse node health:', e)
    return undefined
  }
}
