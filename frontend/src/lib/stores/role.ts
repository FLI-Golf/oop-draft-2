import { writable } from "svelte/store";
import type { Role } from "$lib/auth/policy";

export type DemoRole = Role | "Anonymous";

function createRoleStore() {
  // Initialize from localStorage if available
  let initial: DemoRole = "Anonymous";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("demo_role");
    if (stored && ["Admin", "Scorekeeper", "Pro", "Basic User", "Anonymous"].includes(stored)) {
      initial = stored as DemoRole;
    }
  }

  const { subscribe, set } = writable<DemoRole>(initial);

  return {
    subscribe,
    set: (role: DemoRole) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_role", role);
      }
      set(role);
    }
  };
}

export const currentRole = createRoleStore();
