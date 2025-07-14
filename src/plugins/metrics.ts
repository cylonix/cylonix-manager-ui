// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { axiosInstance, tryRequest } from "@/plugins/api"
import type { Alert } from "@/plugins/alert"
export interface Result {
  result?: Array<any>
  alert?: Alert
  count?: number
  values?: Array<Array<number>>
}

export enum CountType {
  User = 1,
  OnlineUser,
  Device,
  OnlineDevice,
  Label,
  Policy,
  Alarm,
}

export interface GetCountParams {
  countType: CountType
  namespace: string
  userID?: string
  deviceID?: string
  time?: string | number
  start?: string | number
  end?: string | number
  step?: string | number
}

export async function getCount(
  params: GetCountParams,
): Promise<Result | undefined> {
  let q = getCountMetricName(params.countType)
  const ns = `namespace="${params.namespace}"`
  if (params.deviceID) {
    q = `device_summary_${q}{${ns} && deviceID="${params.deviceID}"}`
  } else if (params.userID) {
    q = `user_summary_${q}{${ns} && userID="${params.userID}"}`
  } else {
    q = `namespace_summary_${q}{${ns}}`
  }
  const ret = await query(q, params.time, params.start, params.end, params.step)
  if (!ret) {
    return
  }
  if ('result' in ret) {
    if (params.time || !params.start) {
      return { count: getFirstVectorValue(ret) }
    } else {
      return { values: getFirstMatrixValues(ret) }
    }
  }
  return ret
}

async function query(
  queryString: string,
  time?: string | number,
  start?: string | number,
  end?: string | number,
  step?: string | number,
) {
  if (time || !start) {
    return await queryInstance(queryString, time)
  } else {
    return await queryRange(
      queryString,
      start,
      end ?? Math.floor(Date.now() / 1000),
      step ?? "1d",
    )
  }
}

async function queryInstance(query: string, time?: string | number) {
  return await request("/metrics/api/v1/query", {
    query: query,
    time: time,
  })
}

async function queryRange(
  query: string,
  start: string | number,
  end: string | number,
  step: string | number,
) {
  return await request("/metrics/api/v1/query_range", {
    query: query,
    start: start,
    end: end,
    step: step,
  })
}

async function request(
  api: string,
  params: object,
): Promise<Result | undefined> {
  let resp
  const ret = await tryRequest(async () => {
    const ret = await axiosInstance.get(api, {
      params: params,
    })
    console.log("request result:", params, ret)
    resp = ret.data?.data
  })
  if (resp) {
    return resp
  }
  return { alert: ret }
}

function getFirstVectorValue(r: Result): number | undefined {
  if (r.result &&
    r.result.length &&
    r.result.length > 0 &&
    r.result[0].value &&
    r.result[0].value.length > 1) {
    return r.result[0].value[1]
  }
}

function getFirstMatrixValues(r: Result): Array<Array<number>> | undefined {
  if (!r.result || !r.result.length) {
    console.log('empty result.')
    return
  }
  return r.result[0].values
}

function getCountMetricName(countType: CountType): string {
  switch (countType) {
    case CountType.User:
      return "user_count"
    case CountType.OnlineUser:
      return "online_user_count"
    case CountType.Device:
      return "device_count"
    case CountType.OnlineDevice:
      return "online_device_count"
    case CountType.Label:
      return "label_count"
    case CountType.Policy:
      return "policy_count"
    case CountType.Alarm:
      return "alarm_count"
  }
}

