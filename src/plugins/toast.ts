import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'

/**
 *
 * @export
 * @interface Toast
 */
export interface Toast {
  text?: string
  color?: string
  on: boolean
}

export function newToast(t: Toast) {
  const { toast } = storeToRefs(useToastStore())
  toast.value = t
}
