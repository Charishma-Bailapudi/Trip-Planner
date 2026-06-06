# Research: AI Trip Planner

## Decisions & Rationales

### 1. AI Itinerary Generation Engine
* **Decision**: Gemini 1.5 Flash via `@google/generative-ai` SDK.
* **Rationale**: Very fast response times (essential for satisfying the <15s generation success criteria), large context window, and native JSON output support (structured schema mode) to guarantee formatting consistency for the daily itineraries.
* **Alternatives considered**: 
  - OpenAI GPT-4o-mini (highly capable but requires separate API setup and billing; Gemini API is more cost-effective and has a generous free tier for developers).

### 2. Maps Integration
* **Decision**: Leaflet.js (via React-Leaflet) on frontend, with OpenStreetMap tiles.
* **Rationale**: Open-source, free, and does not require complex billing setup or API key restrictions during development/MVP phase. Highly customizable with interactive markers and route lines.
* **Alternatives considered**:
  - Google Maps API (excellent features, but requires credit card setup and API key management from day one, which can block local validation).

### 3. Weather Integration
* **Decision**: OpenWeatherMap API.
* **Rationale**: Standard industry API for current weather and 5-day / 3-hour forecasts. Very generous free tier (60 calls/minute) and simple REST endpoints.
* **Alternatives considered**:
  - WeatherAPI.com (good alternative but OpenWeatherMap has wider adoption and cleaner client integration examples).

### 4. Transport Integration
* **Decision**: Amadeus Self-Service APIs.
* **Rationale**: Offers pre-configured test sandbox for developers to query flight searches, train searches, and hotel locations without needing commercial agreements.
* **Alternatives considered**:
  - Skyscanner API (requires commercial approval and has stricter access controls).
  - Mocked transport service (we will use Amadeus API with a local mock fallback in case of sandboxed network errors).

### 5. Backend Architecture & ODM
* **Decision**: Node.js with Express.js and Mongoose ODM.
* **Rationale**: Express.js is lightweight, highly performant, and maps perfectly to MongoDB via Mongoose. Mongoose provides schema validation out of the box, which ensures data consistency for trips and itineraries.
