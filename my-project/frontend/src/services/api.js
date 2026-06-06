import axios from 'axios';

// Base backend URL for Trip Planner API
const API_BASE_URL = 'http://localhost:5000/api/trips';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all trips (metadata only)
 */
export const fetchTrips = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    console.error('[API Client] Error fetching trips:', error);
    throw error.response?.data || new Error('Failed to fetch trips');
  }
};

/**
 * Fetch detailed trip by ID (with itinerary)
 */
export const fetchTripById = async (id) => {
  try {
    const response = await apiClient.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API Client] Error fetching trip ${id}:`, error);
    throw error.response?.data || new Error('Failed to fetch trip details');
  }
};

/**
 * Generate and save a new AI trip itinerary
 */
export const generateTrip = async (tripData) => {
  try {
    const response = await apiClient.post('/', tripData);
    return response.data;
  } catch (error) {
    console.error('[API Client] Error generating trip:', error);
    throw error.response?.data || new Error('Failed to generate trip itinerary');
  }
};

/**
 * Delete a trip
 */
export const deleteTrip = async (id) => {
  try {
    const response = await apiClient.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`[API Client] Error deleting trip ${id}:`, error);
    throw error.response?.data || new Error('Failed to delete trip');
  }
};
