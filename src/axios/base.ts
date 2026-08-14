import axios from "axios";

const getCacheKey = (url: string, method = "GET") => `${method}:${url}`;

const getStoredETag = (cacheKey: string) => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(`etag:${cacheKey}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storeETag = (cacheKey: string, etag: string, data: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `etag:${cacheKey}`,
      JSON.stringify({ etag, data, timestamp: Date.now() })
    );
  } catch {
    // ignore quota errors
  }
};

const createBaseApi = (url: string) => {
  const instance = axios.create({
    baseURL: url,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      } else {
        delete config.headers.Authorization;
      }

      if (config.method?.toUpperCase() === "GET") {
        const fullUrl = config.baseURL
          ? `${config.baseURL}${config.url || ""}`
          : config.url || "";
        const cacheKey = getCacheKey(fullUrl, config.method);
        const stored = getStoredETag(cacheKey);
        if (stored?.etag) {
          config.headers["If-None-Match"] = stored.etag;
          (config as { metadata?: { cacheKey: string; cachedData: unknown } }).metadata = {
            cacheKey,
            cachedData: stored.data,
          };
        }
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      if (
        response.config.method?.toUpperCase() === "GET" &&
        response.status === 200 &&
        response.headers["etag"]
      ) {
        const fullUrl = response.config.baseURL
          ? `${response.config.baseURL}${response.config.url || ""}`
          : response.config.url || "";
        const cacheKey = getCacheKey(fullUrl, response.config.method);
        storeETag(cacheKey, response.headers["etag"], response.data);
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 304) {
        const cachedData = error.config?.metadata?.cachedData;
        if (cachedData) {
          return Promise.resolve({
            ...error.response,
            data: cachedData,
            status: 200,
          });
        }
      }

      if (error.response?.status === 401 && typeof window !== "undefined") {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("userData");
      }

      error.formattedError = {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.msg ||
          error.message ||
          "An error occurred",
        status: error.response?.status || 500,
        data: null,
      };

      return Promise.reject(error);
    }
  );

  return instance;
};

export default createBaseApi;
