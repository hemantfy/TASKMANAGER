export const normalizeRole = (role) => {
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