/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BUSINESS_PHONE?: string;
  readonly VITE_BUSINESS_WHATSAPP?: string;
  readonly VITE_BUSINESS_EMAIL?: string;
  readonly VITE_BUSINESS_CITY?: string;
  readonly VITE_BUSINESS_INSTAGRAM?: string;
  readonly VITE_BUSINESS_HOURS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
