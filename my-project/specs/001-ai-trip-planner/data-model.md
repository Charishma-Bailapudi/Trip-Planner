# Data Model: AI Trip Planner

## Schema Definitions (MongoDB/Mongoose)

### 1. Trip Schema
The root document representing a user's planned trip.

```javascript
const TripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  destinations: [{
    name: { type: String, required: true },
    stayDurationDays: { type: Number, required: true }
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: {
    mode: { 
      type: String, 
      enum: ['tier', 'daily_limit', 'total_cap'], 
      required: true 
    },
    tier: { type: String, enum: ['budget', 'moderate', 'luxury'] },
    limitAmount: { type: Number }, // For daily_limit or total_cap
    currency: { type: String, default: 'USD' }
  },
  transportPreferences: [{ 
    type: String, 
    enum: ['flight', 'train', 'bus', 'car_rental', 'driving'] 
  }],
  tripStructure: {
    type: String,
    enum: ['linear', 'hub_and_spoke', 'flex'],
    required: true
  },
  itinerary: [ItineraryDaySchema],
  createdAt: { type: Date, default: Date.now }
});
```

### 2. ItineraryDay Schema (Nested)
Represents a single day within the trip.

```javascript
const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: Date, required: true },
  activities: [ActivitySchema],
  transits: [TransitSegmentSchema]
});
```

### 3. Activity Schema (Nested)
Represents a planned event or sightseeing activity.

```javascript
const ActivitySchema = new mongoose.Schema({
  timeSlot: { type: String, required: true }, // e.g., "Morning", "Afternoon", "10:00 AM"
  title: { type: String, required: true },
  description: { type: String },
  location: {
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  cost: { type: Number, default: 0 }
});
```

### 4. TransitSegment Schema (Nested)
Represents travel legs between locations.

```javascript
const TransitSegmentSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  mode: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  estimatedCost: { type: Number, default: 0 }
});
```

## Validation Rules
1. **Dates**: `endDate` must be greater than or equal to `startDate`.
2. **Budget Mode Validation**:
   - If `budget.mode` is `'tier'`, `budget.tier` is required.
   - If `budget.mode` is `'daily_limit'` or `'total_cap'`, `budget.limitAmount` must be a positive number.
3. **Destinations**: Must contain at least one destination.
