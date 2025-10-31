import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { clearToken, getToken, setToken } from "../utils/tokenStorage";
import { normalizeRole } from "../utils/roleUtils";
import UserContext from "./UserContext";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      const accessToken = getToken();

      if (!accessToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        if (isMounted) {
          setUser(withNormalizedRole(response.data));
        }
      } catch (error) {
        console.error("User not authenticated", error);
        clearToken();        
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeUser();

    return () => {
      isMounted = false;
    };
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
 