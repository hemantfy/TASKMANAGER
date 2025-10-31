import { createContext } from "react";

const isDevelopment = () => {
  try {
    return Boolean(typeof import.meta !== "undefined" && import.meta?.env?.DEV);
  } catch (error) {
    return false;
  }
};

const noop = (actionName) => () => {
  if (isDevelopment()) {
    console.warn(`UserContext: attempted to call ${actionName} outside of UserProvider.`);
  }
};

const defaultContextValue = {
  user: null,
  loading: true,
  updateUser: noop("updateUser"),
  clearUser: noop("clearUser"),
};

export const UserContext = createContext(defaultContextValue);

export default UserContext;