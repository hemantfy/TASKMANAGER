import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { clearToken, getToken, setToken } from "../utils/tokenStorage";
import { normalizeRole } from "../utils/roleUtils";

export const UserContext = createContext();

const withNormalizedRole = (userData) => {
  if (!userData || typeof userData !== "object") {
    return userData;
  }

  return {
    ...userData,
    role: normalizeRole(userData.role),
  };
};

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New state to track loading

  useEffect(() => {
    if (user) return;

    const accessToken = getToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(withNormalizedRole(response.data));
      } catch (error) {
        console.error("User not authenticated", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (userData, options = {}) => {
    const normalizedUser = withNormalizedRole(userData);

    setUser(normalizedUser);
    if (normalizedUser?.token) {
      setToken(normalizedUser.token, options.rememberMe);
    }
    setLoading(false);
  };
  
  const clearUser = () => {
    setUser(null);
    clearToken();
  };
  
  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
 