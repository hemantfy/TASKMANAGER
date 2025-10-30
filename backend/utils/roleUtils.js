const DEFAULT_ROLE = "member";
const PRIVILEGED_ROLES = ["admin", "owner"];

const normalizeRole = (role) => {
  if (typeof role === "string") {
    return role.trim().toLowerCase();
  }

  return role ?? "";
};

const matchesRole = (role, expectedRole) => {
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

const getRoleLabel = (role) => {
  if (matchesRole(role, "owner")) {
    return "Owner";
  }

  if (matchesRole(role, "admin")) {
    return "Admin";
  }

  if (matchesRole(role, "member")) {
    return "Member";
  }

  if (matchesRole(role, "client")) {
    return "Client";
  }

  return "";
};

const hasPrivilegedAccess = (role) =>
  matchesRole(role, "admin") || matchesRole(role, "owner");

const isOwnerRole = (role) => matchesRole(role, "owner");

const formatUserRole = (user) => {
  if (!user || typeof user !== "object") {
    return user;
  }

  const userObject = typeof user.toObject === "function" ? user.toObject() : user;
  const normalizedRole = normalizeRole(userObject.role) || DEFAULT_ROLE;

  return {
    ...userObject,
    role: normalizedRole,
    roleLabel: getRoleLabel(normalizedRole),
  };
};

module.exports = {
  DEFAULT_ROLE,
  PRIVILEGED_ROLES,
  formatUserRole,
  getRoleLabel,
  hasPrivilegedAccess,
  isOwnerRole,
  matchesRole,
  normalizeRole,
};