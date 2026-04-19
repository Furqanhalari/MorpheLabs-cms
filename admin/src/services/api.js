import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // sends HttpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach access token ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ────────────────────────────────────────────────────
let refreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(p => error ? p.reject(error) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry &&
        error.response?.data?.code === 'TOKEN_EXPIRED') {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        sessionStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
