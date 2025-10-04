const normalizeRole = (role) => {
  if (typeof role !== "string") {
    return role;
  }

  return role.trim().toLowerCase();
};

const formatUserRole = (user = {}) => {
  if (!user) {
    return user;
  }

  const normalizedRole = normalizeRole(user.role);

  if (typeof user.toObject === "function") {
    const userObject = user.toObject();
    userObject.role = normalizedRole;
    return userObject;
  }

  return { ...user, role: normalizedRole };
};

module.exports = {
  normalizeRole,
  formatUserRole,
};