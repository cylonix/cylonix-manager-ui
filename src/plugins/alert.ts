// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

/**
 *
 * @export
 * @interface Alert
 */
export interface Alert {
  on: boolean
  text?: string
  title?: string
  type?: 'success' | 'info' | 'warning' | 'error'
}

export class AlertObject {
  alert: Alert
  constructor (a: Alert) {
    this.alert = a
  }
}
