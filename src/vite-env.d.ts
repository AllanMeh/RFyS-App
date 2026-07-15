/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Declaración de variables de entorno de Vite para TypeScript.
 * Agrega aquí cualquier variable VITE_* que uses en el proyecto.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Agrega más variables aquí según sea necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
