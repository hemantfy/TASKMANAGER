import axios from "axios";
import { API_PATHS, BASE_URL } from "./apiPaths";
import { getToken } from "./tokenStorage";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const normalizeBaseUrl = (url) => {
  if (!url) {
    return "";
  }

  return url.replace(/\/?$/, "");
};

const resolveBaseUrl = () => {
  const envBaseUrl =
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) ||
    (typeof globalThis !== "undefined" ? globalThis?.process?.env?.VITE_API_BASE_URL : undefined);

  const baseUrlCandidate = envBaseUrl || BASE_URL;

  return normalizeBaseUrl(baseUrlCandidate);
};

const mergeUrl = (url, baseUrl) => {
  if (!url) {
    return url;
  }

  if (ABSOLUTE_URL_REGEX.test(url)) {
    return url;
  }

  const sanitizedBase = normalizeBaseUrl(baseUrl || BASE_URL);
  const sanitizedPath = url.startsWith("/") ? url.slice(1) : url;

  return `${sanitizedBase}/${sanitizedPath}`;
};

const initialBaseUrl = resolveBaseUrl();

const resolveTimeout = () => {
  const envTimeout =
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_TIMEOUT) ||
    (typeof globalThis !== "undefined" ? globalThis?.process?.env?.VITE_API_TIMEOUT : undefined);

  const parsedTimeout = Number.parseInt(envTimeout, 10);

  if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
    return parsedTimeout;
  }

  // Render-hosted services can take a while to warm up. Give them plenty of time
  // instead of failing after just 10 seconds.
  return 60000;
};

const axiosInstance = axios.create({
  baseURL: initialBaseUrl,
  timeout: resolveTimeout(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const computedBaseUrl =
      normalizeBaseUrl(config.baseURL) || axiosInstance.defaults.baseURL || initialBaseUrl;

    config.url = mergeUrl(config.url, computedBaseUrl);
    config.baseURL = undefined;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors globally
    if (error.response) {
      if (error.response.status === 401) {
        const requestUrl = error.config?.url || "";
        const isAuthRequest = [API_PATHS.AUTH.LOGIN].some((path) => requestUrl.endsWith(path));
        const isAlreadyOnLoginPage = window.location.pathname === "/login";

        if (!isAuthRequest && !isAlreadyOnLoginPage) {
          window.location.replace("/login");
        }
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;