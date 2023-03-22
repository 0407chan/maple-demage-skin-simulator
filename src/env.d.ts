/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ID: string
  readonly VITE_REGION: string
  readonly VITE_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
