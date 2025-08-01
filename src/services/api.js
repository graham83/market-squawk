import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://data-dev.pricesquawk.com';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Response Error:', error.response?.status, error.message);
    }
    
    // Handle common HTTP errors
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('Requested resource not found');
        case 500:
          throw new Error('Server error occurred');
        case 503:
          throw new Error('Service temporarily unavailable');
        default:
          throw new Error(`API error: ${error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to reach the server');
    } else {
      throw new Error('Request configuration error');
    }
  }
);

export default api;