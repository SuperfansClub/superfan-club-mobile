// API Configuration for Superfan Club Mobile App
// This centralizes all API-related configuration and environment handling

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Environment-based API configuration
const API_CONFIGS = {
  development: {
    baseUrl: 'https://56ac3b63-8319-469f-bf69-ed75605af1f3-00-1my3hb9q1uspg.picard.replit.dev', // Current Replit deployment
    timeout: 10000,
    retryAttempts: 3,
  },
  production: {
    baseUrl: 'https://56ac3b63-8319-469f-bf69-ed75605af1f3-00-1my3hb9q1uspg.picard.replit.dev', // Current Replit deployment
    timeout: 15000,
    retryAttempts: 5,
  },
} as const;

// Get current environment
const getCurrentEnvironment = (): keyof typeof API_CONFIGS => {
  // Check if we're in development mode (React Native)
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev ? 'development' : 'production';
};

// Export the current API configuration
export const API_CONFIG: ApiConfig = API_CONFIGS[getCurrentEnvironment()];

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.baseUrl}${cleanEndpoint}`;
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  USER: '/api/user',
  
  // Restaurant/Business data
  RESTAURANT: '/api/restaurant',
  RESTAURANT_STATS: '/api/restaurant/stats',
  RESTAURANT_EXPORT: '/api/restaurant/export',
  
  // Feedback management
  FEEDBACK: '/api/feedback',
  FEEDBACK_ESCALATED: '/api/feedback/escalated',
  FEEDBACK_AI_RESOLUTION: '/api/feedback/:id/ai-resolution',
  GENERATE_RESOLUTION: '/api/generate-resolution',
  
  // Device and notification management
  DEVICE_REGISTER: '/api/devices/register',
  DEVICE_SUBSCRIPTION: '/api/devices/:deviceId/subscription',
  DEVICE_HEARTBEAT: '/api/devices/heartbeat',
  
  // Escalations
  ESCALATIONS: '/api/escalations/device',
  ESCALATIONS_DEVICE: '/api/escalations/device',
  RESOLVE_ESCALATION: '/api/resolve-escalation/:feedbackId',
  
  // Settings
  SETTINGS: '/api/settings',
  NOTIFICATIONS: '/api/notifications',
} as const;

// Axios configuration helper
export const createAxiosConfig = () => ({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});