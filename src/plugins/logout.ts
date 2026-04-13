// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { loginAPI, tryRequest, vpnAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useNoticeStore } from '@/stores/notices'
import { useUserStore } from '@/stores/user'

export async function logout(ignoreErrors = false) {
  const userStore = useUserStore()
  const noticeStore = useNoticeStore()
  if (!userStore.loggedIn) {
    return
  }
  userStore.$reset()
  noticeStore.$reset()
  const ret = await tryRequest(async () => {
    const errors: Error[] = []
    try {
      await loginAPI.logout()
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
    }
    try {
      await vpnAPI.headscaleServiceDeleteApiKey("")
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
    }
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.message).join('; '))
    }
  })
  if (ret && !ignoreErrors) {
    newToast({
      on: true,
      color: 'red',
      text: ret.text,
    })
  }
}
