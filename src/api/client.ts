import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000'),
  withCredentials: true,
});
