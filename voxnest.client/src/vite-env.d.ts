/// <reference types="vite/client" />

declare global {
  interface Window {
    extensionFramework: {
      getStats: () => Record<string, unknown>;
      [key: string]: unknown;
    };
  }
}