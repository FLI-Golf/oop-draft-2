// src/lib/pb.ts
import PocketBase from "pocketbase";

const CODESPACE_PB_8090 =
  "https://turbo-space-barnacle-wrw7vwv5vj9c54xr-8090.app.github.dev";

function resolveBaseUrl(): string {
  // Highest priority: explicit env var from SvelteKit/Vite
  const envUrl = (import.meta.env.PUBLIC_PB_URL as string | undefined)?.trim();
  if (envUrl) return envUrl;

  // Browser inference for Codespaces: swap -5173 to -8090
  if (typeof window !== "undefined") {
    const host = window.location.host; // e.g. ...-5173.app.github.dev
    if (host.endsWith(".app.github.dev")) {
      const pbHost = host.replace(/-\d+\.app\.github\.dev$/, "-8090.app.github.dev");
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
