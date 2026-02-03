// frontend/src/lib/auth/policy.ts

export type Role = "Admin" | "Scorekeeper" | "Pro" | "Basic User";

export type Capability =
  | "tournament:manage"
  | "score:enter"
  | "interaction:post"; // placeholder for comments / interactions

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false;

  switch (role) {
    case "Admin":
      return true; // Admin can do everything in demo

    case "Scorekeeper":
      return capability === "score:enter";

    case "Pro":
      return capability === "interaction:post"; // not implemented, but intentional

    case "Basic User":
      return false;

    default:
      return false;
  }
}
