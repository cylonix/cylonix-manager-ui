// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { md3 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { mdi as mdiSvg } from 'vuetify/iconsets/mdi-svg'

// Composables
import { createVuetify } from 'vuetify'

// Labs
import { VNumberInput } from 'vuetify/labs/VNumberInput'

// Env
import getEnv from '@/utils/env'


// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VNumberInput
  },
  defaults: {
    VCard: {
      class: 'rounded-xl'
    },
    VChip: {
      class: 'rounded-xl',
    },
    VDataTable: {
      class: 'rounded-xl',
    },
    VDataTableServer: {
      class: 'rounded-xl',
    },
    VSheet: {
      elevation: 2,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
      mdiSvg
    },
  },
  theme: {
    defaultTheme: 'light',
  },
  blueprint: getEnv('VITE_USE_MD3') ? md3 : undefined,
})
