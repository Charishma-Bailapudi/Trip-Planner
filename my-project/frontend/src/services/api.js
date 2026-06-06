import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to dynamically attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Authentication API Methods
 */
export const login = async (emailOrUsername, password) => {
  try {
    const response = await apiClient.post('/auth/login', { emailOrUsername, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('[API Client] Login failed:', error);
    throw error.response?.data || new Error('Login failed. Please try again.');
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await apiClient.post('/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('[API Client] Registration failed:', error);
    throw error.response?.data || new Error('Registration failed. Please try again.');
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('[API Client] Error fetching current user:', error);
    throw error.response?.data || new Error('Failed to fetch user profile');
  }
};

/**
 * Trip Planning API Methods
 */
export const fetchTrips = async () => {
  try {
    const response = await apiClient.get('/trips');
    return response.data;
  } catch (error) {
    console.error('[API Client] Error fetching trips:', error);
    throw error.response?.data || new Error('Failed to fetch trips');
  }
};

export const fetchTripById = async (id) => {
  try {
    const response = await apiClient.get(`/trips/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API Client] Error fetching trip ${id}:`, error);
    throw error.response?.data || new Error('Failed to fetch trip details');
  }
};

export const generateTrip = async (tripData) => {
  try {
    const response = await apiClient.post('/trips', tripData);
    return response.data;
  } catch (error) {
    console.error('[API Client] Error generating trip:', error);
    throw error.response?.data || new Error('Failed to generate trip itinerary');
  }
};

export const deleteTrip = async (id) => {
  try {
    const response = await apiClient.delete(`/trips/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API Client] Error deleting trip ${id}:`, error);
    throw error.response?.data || new Error('Failed to delete trip');
  }
};
