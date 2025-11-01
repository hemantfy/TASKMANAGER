import axios from "axios";
import { API_PATHS, BASE_URL } from "./apiPaths";
import { getToken } from "./tokenStorage";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

const normalizeBaseUrl = (url) => {
  if (!isNonEmptyString(url)) {
    return "";
  }

  return url.trim().replace(/\/?$/, "");
};

const getEnvValue = (key) => {
  const fromImportMeta = typeof import.meta !== "undefined" ? import.meta?.env?.[key] : undefined;

  if (isNonEmptyString(fromImportMeta)) {
    return fromImportMeta;
  }

  const fromProcess =
    typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env
      ? globalThis.process.env[key]
      : undefined;

  return fromProcess;
};

const deriveLocalBaseUrl = () => {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "";
  }

  const { protocol, hostname } = window.location;
  const normalizedHost = hostname?.trim().toLowerCase();

  const isLocalHost =
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "0.0.0.0" ||
    normalizedHost?.endsWith(".local");

  if (!isLocalHost) {
    return "";
  }

  const configuredPort = getEnvValue("VITE_BACKEND_PORT");
  const parsedPort = Number.parseInt(configuredPort, 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 5000;

  return `${protocol}//${hostname}:${port}`;
};

const resolveBaseUrl = () => {
  const envBaseUrl = normalizeBaseUrl(getEnvValue("VITE_API_BASE_URL"));
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const localBaseUrl = normalizeBaseUrl(deriveLocalBaseUrl());
  if (localBaseUrl) {
    return localBaseUrl;
  }

  return normalizeBaseUrl(BASE_URL);
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