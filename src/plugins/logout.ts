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
    let e1, e2
    try {
      await loginAPI.logout()
    } catch (e) {
      e1 = e
    }
    try {
      await vpnAPI.headscaleServiceDeleteApiKey("")
      console.log("delete api key succeeded")
    } catch (e) {
      e2 = e
    }
    if (e1 || e2) {
      throw `${e1} ${e2}`
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
