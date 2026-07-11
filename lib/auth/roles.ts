type RoleLike = string | string[] | null | undefined;

export function normalizeRoles(role: RoleLike) {
  if (!role) return [];
  const roles = Array.isArray(role) ? role : role.split(",");
  return roles.map((value) => value.trim().toUpperCase()).filter(Boolean);
}

export function isAdminRole(role: RoleLike) {
  return normalizeRoles(role).includes("ADMIN");
}
