# Quickstart & Validation Guide: AI Trip Planner

This guide describes how to run and validate the AI Trip Planner application end-to-end.

## Prerequisites
- **Node.js**: v18 or newer
- **MongoDB**: A running local instance or a MongoDB Atlas connection string
- **Gemini API Key**: Set in the backend environment as `GEMINI_API_KEY`
- **OpenWeatherMap API Key**: Set in the backend environment as `WEATHER_API_KEY`

## Setup Instructions

### 1. Clone & Install Dependencies
From the repository root, install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trip-planner
GEMINI_API_KEY=your_gemini_api_key_here
WEATHER_API_KEY=your_openweathermap_api_key_here
```

### 3. Run the Servers
Start both servers in development mode:
```bash
# In backend directory:
npm run dev

# In frontend directory:
npm run dev
```

## End-to-End Validation Scenario

Follow this scenario to verify the feature works as expected:

1. **Open the App**: Navigate to `http://localhost:5173` (or the local dev URL printed by Vite).
2. **Fill Travel Preferences**:
   - Destination: Enter `Paris`
   - Dates: Choose a 3-day range in the future
   - Budget Mode: Select `Total Cap` and set the limit to `500 USD`
   - Transport Preferences: Check `Flight` and `Train`
   - Structure: Select `Linear`
3. **Generate Itinerary**: Click the **Generate Trip** button.
4. **Expected Outcomes**:
   - The UI shows a loading state (should resolve in **under 15 seconds** as per [Success Criteria](../spec.md#measurable-outcomes)).
   - A day-by-day interactive itinerary is rendered showing activity cards, route segments, and transit legs.
   - An interactive Leaflet map loads, displaying markers for all suggested activities.
   - Current or seasonal weather details are displayed for Paris.
   - The database stores the generated trip matching the schema in [data-model.md](../data-model.md).
