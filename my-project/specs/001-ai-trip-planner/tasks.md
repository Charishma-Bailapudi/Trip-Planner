# Tasks: AI Trip Planner

**Input**: Design documents from `/specs/001-ai-trip-planner/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize backend Node.js/Express.js project in `backend/`
- [x] T002 Initialize frontend React.js (Vite) project in `frontend/`
- [x] T003 [P] Configure TailwindCSS/CSS styling framework in `frontend/src/index.css`
- [x] T004 [P] Configure environment variable loading in `backend/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Setup MongoDB connection module in `backend/src/config/db.js`
- [x] T006 [P] Implement error handling and logging middleware in `backend/src/middleware/errorHandler.js`
- [x] T007 [P] Create base Express server configuration in `backend/src/server.js`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Personalized Itinerary Generation (Priority: P1) 🎯 MVP

**Goal**: Allow users to enter travel preferences (destination, dates, budget, transport) and generate a tailored day-wise itinerary via Gemini AI.

**Independent Test**: Start frontend and backend, navigate to dashboard, enter one destination with dates and budget/transport selections, click Generate, and verify the detailed day-by-day activities display.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create Trip Mongoose schema in `backend/src/models/Trip.js`
- [x] T009 [US1] Implement Gemini AI service in `backend/src/services/geminiService.js` utilizing Gemini 1.5 Flash structured schema generation
- [x] T010 [US1] Implement Trip Controller generation endpoint in `backend/src/controllers/tripController.js` and bind it to `/api/trips` routes in `backend/src/api/routes.js`
- [x] T011 [P] [US1] Create React API client service in `frontend/src/services/api.js`
- [x] T012 [P] [US1] Implement travel preferences input component in `frontend/src/components/PreferenceForm.jsx`
- [x] T013 [US1] Implement day-wise itinerary display component in `frontend/src/components/ItineraryDisplay.jsx`
- [x] T014 [US1] Build main Planner Dashboard page in `frontend/src/pages/PlannerDashboard.jsx` integrating the input form and itinerary view

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Maps, Weather, and Transport Integration (Priority: P2)

**Goal**: Fetch and display Leaflet maps, weather forecasts, and transport details alongside the AI itinerary.

**Independent Test**: Generate a trip and verify that the Leaflet map loads pins/routes, weather widget displays forecasts, and transport choices are listed.

### Implementation for User Story 2

- [x] T015 [US2] Implement weather service API integration in `backend/src/services/weatherService.js` using OpenWeatherMap API
- [x] T016 [US2] Implement transport service integration with Amadeus API (or sandbox fallback) in `backend/src/services/transportService.js`
- [x] T017 [US2] Integrate weather and transport lookups into the Trip Controller flow in `backend/src/controllers/tripController.js`
- [x] T018 [P] [US2] Create Leaflet interactive Route Map component in `frontend/src/components/RouteMap.jsx`
- [x] T019 [P] [US2] Create Weather Widget component in `frontend/src/components/WeatherWidget.jsx`
- [x] T020 [P] [US2] Create Transport Suggestions component in `frontend/src/components/TransportSuggestions.jsx`
- [x] T021 [US2] Integrate Map, Weather, and Transport widgets into the Dashboard layout in `frontend/src/pages/PlannerDashboard.jsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Multi-Destination Support (Priority: P3)

**Goal**: Allow adding multiple destinations with chronological stays, hub-and-spoke trips, or flexible route ordering.

**Independent Test**: Input multiple destinations (e.g. Paris 2 days, Rome 3 days), select trip structure, click Generate, and verify the unified itinerary is created.

### Implementation for User Story 3

- [x] T022 [US3] Extend Gemini AI prompt templates and structured JSON schema in `backend/src/services/geminiService.js` to process multiple stay durations
- [x] T023 [P] [US3] Update Mongoose Trip schema validations in `backend/src/models/Trip.js` to support array destination fields
- [x] T024 [US3] Update input preference component in `frontend/src/components/PreferenceForm.jsx` to dynamically add/remove destinations and structure selections
- [x] T025 [US3] Update Route Map component in `frontend/src/components/RouteMap.jsx` to handle pathing between multiple sequential destinations

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Aesthetics, animations, and final verification

- [x] T026 [P] Add premium aesthetics, smooth transitions, and loading states in `frontend/src/index.css`
- [x] T027 Run full end-to-end validation scenario defined in `specs/001-ai-trip-planner/quickstart.md`

---

## Phase 7: Authentication & Currency Selection (Completed)

**Goal**: Implement secure user registration/login, session management, and flexible currency configurations (USD, INR, EUR, GBP, JPY) across the planner.

- [x] T028 [US4] Implement User mongoose model at `backend/src/models/User.js`
- [x] T029 [US4] Implement JWT authorization middleware at `backend/src/middleware/authMiddleware.js`
- [x] T030 [US4] Implement register, login, and profile controllers at `backend/src/controllers/authController.js`
- [x] T031 [US4] Define authentication routes at `backend/src/api/authRoutes.js` and register in `backend/src/server.js`
- [x] T032 [US4] Update `backend/src/models/Trip.js` schema to store ownership mapping to `User`
- [x] T033 [US4] Secure all trip endpoints in `backend/src/controllers/tripController.js` to ensure users only CRUD their own trips
- [x] T034 [US4] Create frontend `AuthPage.jsx` supporting login/register toggle and styling validation
- [x] T035 [US4] Integrate dynamic session management in `frontend/src/App.jsx` and request header interceptors in `frontend/src/services/api.js`
- [x] T036 Add dynamic currency selection dropdown in `frontend/src/components/PreferenceForm.jsx`
- [x] T037 Update `ItineraryDisplay.jsx` and `TransportSuggestions.jsx` to render dynamic currency symbols (₹, €, £, ¥, $) based on preferences
- [x] T038 Update download itinerary generator in `PlannerDashboard.jsx` to print currency-aligned cost symbols

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - Can proceed sequentially (P1 → P2 → P3).
- **Polish (Phase 6)**: Depends on all user stories being complete.

---

## Parallel Example: User Story 1

```bash
# Launch models and frontend components in parallel:
Task: "Create Trip Mongoose schema in backend/src/models/Trip.js"
Task: "Create React API client service in frontend/src/services/api.js"
Task: "Implement travel preferences input component in frontend/src/components/PreferenceForm.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently.
