# API Contracts: AI Trip Planner

All request and response bodies use JSON format.

## 1. Generate & Save Trip Itinerary
* **Method**: `POST`
* **Path**: `/api/trips`
* **Request Body**:
  ```json
  {
    "title": "Summer EuroTrip",
    "destinations": [
      { "name": "Paris", "stayDurationDays": 3 },
      { "name": "Rome", "stayDurationDays": 2 }
    ],
    "startDate": "2026-07-01",
    "endDate": "2026-07-06",
    "budget": {
      "mode": "total_cap",
      "limitAmount": 1500,
      "currency": "USD"
    },
    "transportPreferences": ["flight", "train"],
    "tripStructure": "linear"
  }
  ```
* **Success Response** (`201 Created`):
  ```json
  {
    "_id": "603d2b2f8a49c95b74bf71a1",
    "title": "Summer EuroTrip",
    "destinations": [
      { "name": "Paris", "stayDurationDays": 3 },
      { "name": "Rome", "stayDurationDays": 2 }
    ],
    "startDate": "2026-07-01",
    "endDate": "2026-07-06",
    "budget": {
      "mode": "total_cap",
      "limitAmount": 1500,
      "currency": "USD"
    },
    "transportPreferences": ["flight", "train"],
    "tripStructure": "linear",
    "itinerary": [
      {
        "dayNumber": 1,
        "date": "2026-07-01T00:00:00.000Z",
        "activities": [
          {
            "timeSlot": "Morning",
            "title": "Eiffel Tower Visit",
            "description": "Ascend the iconic tower for city views.",
            "location": {
              "name": "Eiffel Tower",
              "latitude": 48.8584,
              "longitude": 2.2945
            },
            "cost": 30
          }
        ],
        "transits": []
      }
    ],
    "createdAt": "2026-06-06T12:00:00.000Z"
  }
  ```

## 2. List All Trips
* **Method**: `GET`
* **Path**: `/api/trips`
* **Success Response** (`200 OK`):
  ```json
  [
    {
      "_id": "603d2b2f8a49c95b74bf71a1",
      "title": "Summer EuroTrip",
      "destinations": [{ "name": "Paris", "stayDurationDays": 3 }],
      "startDate": "2026-07-01",
      "endDate": "2026-07-06"
    }
  ]
  ```

## 3. Get Specific Trip Details
* **Method**: `GET`
* **Path**: `/api/trips/:id`
* **Success Response** (`200 OK`):
  *(Returns the full Trip document containing the detailed daily itinerary)*
