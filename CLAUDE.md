# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cylonix Manager UI — a Vue 3 SPA for managing secure network access (WireGuard mesh via Headscale). Built with Vite, TypeScript, Vuetify 3, and Pinia.

## Common Commands

- `make dev` — install deps and start dev server (port 3030)
- `make build` — production build (runs `vue-tsc --noEmit` then `vite build`)
- `make generate` — regenerate all OpenAPI clients (requires `openapi/` submodule initialized)
- `make supervisor-api`, `make manager-api`, `make headscale-api` — regenerate individual API clients
- `make docker` — build Docker image
- `npm run preview` — preview production build

- `npm test` — run tests (Vitest)
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — lint with ESLint
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — format with Prettier

## Architecture

### API Layer (`src/plugins/api.ts`)

Three generated API clients live under `src/clients/` (manager, supervisor, headscale), created from OpenAPI specs in the `openapi/` git submodule via `make generate`. Axios interceptors automatically convert between camelCase (frontend) and snake_case (backend) using `@cylonix/humps`. Auth is cookie-based with `withCredentials`; the supervisor API falls back to an API key from env or the user store.

Exported API instances: `deviceAPI`, `labelAPI`, `loginAPI`, `otpAPI`, `tenantAPI`, `userAPI`, `wgAPI`, `vpnAPI`, plus `sup*API()` factory functions for supervisor endpoints.

### State Management (`src/stores/`)

Pinia stores with `pinia-plugin-persistedstate` for localStorage persistence. The user store (`useUserStore`) holds auth state, roles, tenant info, and a 7-day session TTL checked on mount.

### Routing (`src/plugins/router.ts`)

48+ routes with lazy-loaded components. Routes use `meta.requiresAuth` for auth guards. Role-based redirects: admins go to `/dashboard`, regular users to `/ui/vpn-nodes`.

### Styling

Vuetify 3 with Material Design Icons (`@mdi/js`). SCSS settings in `src/styles/settings.scss`. MD3 blueprint toggleable via `VITE_USE_MD3` env var.

### Build Optimization

- Heavy components in `src/heavy/` are code-split into separate chunks
- Monaco editor split into its own chunk via `vite-plugin-monaco-editor`
- `unplugin-vue-components` auto-imports Vuetify components
- Manual chunk splitting configured in `vite.config.mts`

### Real-time

WebSocket connection at `/ws/log/v1/alert` for server notices, managed via `@vueuse/core` `useWebSocket` composable in `src/composables/wsnotices.ts`.

## Environment

Copy `.env.local.example` to `.env.local` for local development. Key variables:
- `VITE_BASE_URL` — Manager API base path
- `VITE_MANAGER_API_TARGET_URL` — Backend proxy target
- `VITE_MANAGER_VPN_API_TARGET_URL` — VPN API proxy target
- `VITE_WS_URL` — WebSocket endpoint
- `VITE_LOGIN_REDIRECT_BASE_URL` — OAuth callback URL

## Key Conventions

- API clients are generated code — edit OpenAPI specs and run `make generate`, don't modify `src/clients/` directly
- Path alias: `@/` maps to `src/`
- Components use Vue 3 Composition API with `<script setup lang="ts">`
- `console.log` is stripped from production builds via esbuild (keep logs for dev, they won't ship)
- Use strict equality (`===`) not loose (`==`)
- Use `const`/`let` not `var`
- Supervisor API factories (`supFwAPI()` etc.) are lazy singletons — they cache instances until the API key changes
- Reusable server-paginated table logic is in `src/composables/useServerTable.ts`
