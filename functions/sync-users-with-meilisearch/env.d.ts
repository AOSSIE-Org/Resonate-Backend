declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MEILISEARCH_ENDPOINT: string;
      MEILISEARCH_ADMIN_API_KEY: string;
    }
  }
}

export { };
