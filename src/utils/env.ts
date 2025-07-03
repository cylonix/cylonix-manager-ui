declare global {
  interface Window { configs: any; }
}

export default function getEnv(name: string) {
  console.log("windows.configs:", window?.configs)
  return window?.configs?.[name] || import.meta.env[name]
}
