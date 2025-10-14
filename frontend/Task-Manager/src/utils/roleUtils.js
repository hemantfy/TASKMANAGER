export const normalizeRole = (role) => {
  if (typeof role === "string") {
    return role.trim().toLowerCase();
  }

  return role ?? "";
};

export const matchesRole = (role, expectedRole) => {
  const normalizedRole = normalizeRole(role);
  const normalizedExpected = normalizeRole(expectedRole);

  if (!normalizedRole || !normalizedExpected) {
    return false;
  }

  if (normalizedRole === normalizedExpected) {
    return true;
  }

  return (
    normalizedRole.startsWith(`${normalizedExpected}-`) ||
    normalizedRole.startsWith(`${normalizedExpected}_`) ||
    normalizedRole.startsWith(`${normalizedExpected} `)
  );
};

export const getRoleLabel = (role) => {
  if (matchesRole(role, "owner")) {
    return "Owner";
  }

  if (matchesRole(role, "admin")) {
    return "Admin";
  }

  if (matchesRole(role, "member")) {
    return "Member";
  }

  return "";
};

export const hasPrivilegedAccess = (role) =>
  matchesRole(role, "admin") || matchesRole(role, "owner");

export const isOwnerRole = (role) => matchesRole(role, "owner");

export const isRoleAllowed = (role, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.some((expectedRole) => matchesRole(role, expectedRole));
};

export const getPrivilegedBasePath = (role) =>
  matchesRole(role, "owner") ? "/owner" : "/admin";

export const resolvePrivilegedPath = (path, role) => {
  if (typeof path !== "string") {
    return path;
  }

  if (!path.startsWith("/admin")) {
    return path;
  }

  const basePath = getPrivilegedBasePath(role);
  return path.replace(/^\/admin/, basePath);
};

export const getDefaultRouteForRole = (role) => {
  if (matchesRole(role, "owner")) {
    return "/owner/dashboard";
  }

  if (matchesRole(role, "admin")) {
    return "/admin/dashboard";
  }

  return "/user/dashboard";
};