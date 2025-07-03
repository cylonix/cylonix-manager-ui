import { readonly, ref } from 'vue'
import type { V1Node } from '@/clients/headscale/api'

const currentNode = ref<V1Node | null>(null)

export function useCurrentNode() {
  const setCurrentNode = (node: V1Node) => {
    currentNode.value = node
  }

  const getCurrentNode = () => currentNode.value

  return {
    currentNode: readonly(currentNode),
    setCurrentNode,
    getCurrentNode
  }
}
