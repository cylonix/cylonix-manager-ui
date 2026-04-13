// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

declare global {
  interface Window { configs: Record<string, string> | undefined; }
}

export default function getEnv(name: string) {
  return window?.configs?.[name] || import.meta.env[name]
}
