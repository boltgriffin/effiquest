/**
 * Single place that reads `import.meta.env`. Only VITE_-prefixed variables reach the browser,
 * so nothing here may be a secret. See `.env.example`.
 */
export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  appEnv: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,
} as const;
