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
