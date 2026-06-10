import axios from 'axios';

// สร้าง Axios instance พร้อมกำหนด Base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://medical-logbook-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log('API baseURL:', api.defaults.baseURL);

// Request Interceptor: แนบ JWT Token ไปกับทุก Request ถ้ามีอยู่ใน LocalStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Starting Request', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: จัดการ Error ทั่วไป (เช่น 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    if (error.response && error.response.status === 401) {
      // ถ้า Token หมดอายุ หรือไม่ถูกต้อง ให้เตะกลับหน้า Login
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
