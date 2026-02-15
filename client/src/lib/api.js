import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

let authGetter = () => ({ accessToken: "", refreshToken: "" });
let tokenSetter = () => {};
let logoutHandler = () => {};

export const registerAuthHooks = ({ getAuthState, setTokens, onLogout }) => {
  authGetter = getAuthState;
  tokenSetter = setTokens;
  logoutHandler = onLogout;
};

api.interceptors.request.use((config) => {
  const { accessToken } = authGetter();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

function processQueue(newAccessToken) {
  queue.forEach((cb) => cb(newAccessToken));
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken } = authGetter();
    if (!refreshToken) {
      logoutHandler();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      tokenSetter({ accessToken, refreshToken: newRefreshToken });
      processQueue(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      logoutHandler();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;