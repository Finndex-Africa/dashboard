import type { UserRole } from "./role-redirects";

/** Roles that list properties with the same permissions as agents */
export const AGENT_LIKE_ROLES: UserRole[] = ["agent", "real_estate_agency"];

export function isAgentLikeRole(role: UserRole | string | undefined): boolean {
  return AGENT_LIKE_ROLES.includes(role as UserRole);
}

export function canSetAgentFee(role: UserRole | string | undefined): boolean {
  return isAgentLikeRole(role);
}

export function getRoleLabel(role: UserRole | string | undefined): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "admin_property":
      return "Admin (Properties)";
    case "admin_services":
      return "Admin (Services)";
    case "landlord":
      return "Landlord";
    case "agent":
      return "Agent";
    case "real_estate_agency":
      return "Real Estate Agency";
    case "service_provider":
      return "Service Provider";
    case "home_seeker":
      return "Home Seeker";
    default:
      return role ? String(role).replace(/_/g, " ") : "User";
  }
}

export function getRoleColor(role: UserRole | string | undefined): string {
  switch (role) {
    case "admin":
    case "admin_property":
    case "admin_services":
      return "red";
    case "landlord":
      return "blue";
    case "agent":
      return "green";
    case "real_estate_agency":
      return "cyan";
    case "service_provider":
      return "orange";
    case "home_seeker":
      return "blue";
    default:
      return "default";
  }
}
