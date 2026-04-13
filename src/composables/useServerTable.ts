// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { computed, ref, type Ref } from 'vue'
import { decamelize } from '@cylonix/humps'
import type { Alert } from '@/plugins/alert'
import { tryRequest } from '@/plugins/api'

interface SortItem {
  key: string
  order?: string
}

interface TableOptions {
  page: number
  itemsPerPage: number
  sortBy: SortItem[]
  groupBy?: string[]
  groupDesc?: boolean[]
  multiSort?: boolean
  mustSort?: boolean
}

interface LoadResult<T> {
  items: T[]
  total: number
}

interface UseServerTableOptions<T> {
  defaultItemsPerPage?: number
  onLoad: (params: {
    options: TableOptions
    sortBy?: string
    sortDesc?: string
  }) => Promise<LoadResult<T>>
}

/**
 * Builds sort query params from Vuetify data table sort options.
 * Decamelizes keys and concatenates multiple sort fields with commas.
 */
export function buildSortParams(sortBy: SortItem[]): {
  sortBy?: string
  sortDesc?: string
} {
  let sortByStr: string | undefined
  let sortDescStr: string | undefined

  for (const [i, sort] of sortBy.entries()) {
    const key = decamelize(sort.key)
    const order = sort.order ?? ''
    if (i === 0) {
      sortByStr = key
      sortDescStr = order
    } else {
      sortByStr = sortByStr + ',' + key
      sortDescStr = sortDescStr + ',' + order
    }
  }

  return { sortBy: sortByStr, sortDesc: sortDescStr }
}

/**
 * Composable for server-paginated data tables.
 * Handles loading state, sort param building, error handling, and pagination.
 */
export function useServerTable<T>(opts: UseServerTableOptions<T>) {
  const alert = ref<Alert>({ on: false })
  const loading = ref(false)
  const loadOptions = ref<TableOptions>()
  const serverItems = ref([]) as Ref<T[]>
  const totalItems = ref(0)
  const itemsPerPage = ref(opts.defaultItemsPerPage ?? 20)

  const hideFooter = computed(() => totalItems.value <= itemsPerPage.value)

  async function loadItems(options?: TableOptions) {
    if (!options) {
      options = loadOptions.value ?? {
        page: 1,
        itemsPerPage: itemsPerPage.value,
        sortBy: [],
      }
    }
    loadOptions.value = options

    loading.value = true
    const { sortBy, sortDesc } = buildSortParams(options.sortBy)

    const ret = await tryRequest(async () => {
      const result = await opts.onLoad({ options: options!, sortBy, sortDesc })
      serverItems.value = result.items
      totalItems.value = result.total
    })

    if (ret) {
      alert.value = ret
    } else {
      alert.value = { on: false }
    }
    loading.value = false
  }

  async function refresh() {
    await loadItems(loadOptions.value)
  }

  return {
    alert,
    hideFooter,
    itemsPerPage,
    loading,
    loadItems,
    loadOptions,
    refresh,
    serverItems,
    totalItems,
  }
}
