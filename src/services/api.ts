import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token in request headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('babitrack_admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses, timeouts, and auto-logout/refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Friendly error handling for timeouts
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.response = error.response || {
        data: { error: 'Le serveur a mis trop de temps à répondre (Délai dépassé). Veuillez réessayer.' },
        status: 504,
      };
    }

    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        try {
          const refreshToken = localStorage.getItem('babitrack_admin_refresh_token');
          if (refreshToken) {
            console.log('[API] Tentative de rafraîchissement du token JWT...');
            
            // Call refresh endpoint directly using raw axios to avoid loops
            const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken }, { timeout: 15000 });
            const newAccessToken = res.data.accessToken;
            
            localStorage.getItem('babitrack_admin_token');
            localStorage.setItem('babitrack_admin_token', newAccessToken);
            document.cookie = `babitrack_admin_token=${newAccessToken}; path=/; max-age=604800; SameSite=Lax; Secure`;
            
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[API] Échec du rafraîchissement du token:', refreshError);
        }
        
        console.warn('[API] Token expiré ou non valide. Déconnexion...');
        localStorage.removeItem('babitrack_admin_token');
        localStorage.removeItem('babitrack_admin_refresh_token');
        localStorage.removeItem('babitrack_admin_user');
        document.cookie = `babitrack_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
