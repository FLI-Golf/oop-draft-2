// src/lib/pb.ts
import PocketBase from "pocketbase";

function resolveBaseUrl(): string {
  // Highest priority: explicit env var from SvelteKit/Vite
  const envUrl = (import.meta.env.PUBLIC_PB_URL as string | undefined)?.trim();
  if (envUrl) return envUrl;

  // Browser inference for Codespaces/Gitpod: swap port to 8090
  if (typeof window !== "undefined") {
    const host = window.location.host;
    
    // GitHub Codespaces: e.g. ...-5173.app.github.dev
    if (host.endsWith(".app.github.dev")) {
      const pbHost = host.replace(/-\d+\.app\.github\.dev$/, "-8090.app.github.dev");
      return `https://${pbHost}`;
    }
    
    // Gitpod: e.g. 5173--xxx.gitpod.dev
    if (host.includes(".gitpod.dev") || host.includes(".gitpod.io")) {
      const pbHost = host.replace(/^\d+--/, "8090--");
      return `https://${pbHost}`;
    }
  }

  // Local fallback
  return "http://127.0.0.1:8090";
}

export const pb = new PocketBase(resolveBaseUrl());

// Optional: log once in browser so you can verify instantly
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("PocketBase baseUrl:", pb.baseUrl ?? (pb as any).baseUrl);
}
