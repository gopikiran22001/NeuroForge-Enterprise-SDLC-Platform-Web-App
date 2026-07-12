const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let onUnauthorizedCallback = null;
let isRefreshing = false;
let refreshQueue = [];

export function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

const processQueue = (err, token) => {
  refreshQueue.forEach((prom) => {
    if (err) {
      prom.reject(err);
    } else {
      prom.resolve();
    }
  });
  refreshQueue = [];
};

async function request(url, options = {}) {
  const absoluteUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  options.credentials = "include";
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.body && typeof options.body === "object") {
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(absoluteUrl, options);

    // Handle successful responses
    if (response.ok) {
      if (response.status === 204) return null;
      const resJson = await response.json();
      return resJson.data; // Return the data payload from ApiResponse
    }

    // Handle 401 Unauthorized (attempt token refresh)
    if (
      response.status === 401 &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => request(url, options))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (refreshResponse.ok) {
          isRefreshing = false;
          processQueue(null);
          return request(url, options); // Retry original request
        } else {
          throw new Error("Refresh token failed");
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        throw refreshError;
      }
    }

    // Handle standard API errors
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = errorBody.details || [];
    throw error;
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  get: (url, options) => request(url, { ...options, method: "GET" }),
  post: (url, body, options) => request(url, { ...options, method: "POST", body }),
  put: (url, body, options) => request(url, { ...options, method: "PUT", body }),
  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
};
