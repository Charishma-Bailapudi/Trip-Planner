const mongoose = require('mongoose');

// Schema for individual activities within a day
const ActivitySchema = new mongoose.Schema({
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required (e.g. Morning, Afternoon, Evening)']
  },
  title: {
    type: String,
    required: [true, 'Activity title is required']
  },
  description: {
    type: String
  },
  location: {
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  cost: {
    type: Number,
    default: 0
  }
});

const TransitOptionSchema = new mongoose.Schema({
  mode: { type: String, required: true },
  transitNumber: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  originStation: { type: String, required: true },
  destinationStation: { type: String, required: true }
});

// Schema for transit legs between destinations or points of interest
const TransitSegmentSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  mode: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  estimatedCost: { type: Number, default: 0 },
  transitNumber: { type: String },      // e.g. Train 9015, Flight BA-234
  departureTime: { type: String },      // e.g. "09:30 AM"
  arrivalTime: { type: String },        // e.g. "11:45 AM"
  originStation: { type: String },      // e.g. "Paris Gare de Lyon"
  destinationStation: { type: String },  // e.g. "Lyon Part Dieu"
  
  trainOptions: [TransitOptionSchema],
  flightOptions: [TransitOptionSchema],
  busOptions: [TransitOptionSchema],
  
  flightInstructions: { type: String },
  trainInstructions: { type: String },
  busInstructions: { type: String },
  
  selectedMode: { type: String, default: 'train' },
  selectedOptionIndex: { type: Number, default: 0 }
});

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: String },
  estimatedCost: { type: Number },
  description: { type: String },
  address: { type: String }
});

const SightseeingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  recommendedDuration: { type: String },
  bestTimeToVisit: { type: String },
  entryFee: { type: Number, default: 0 },
  description: { type: String }
});

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisineType: { type: String, required: true },
  rating: { type: String },
  costForTwo: { type: Number },
  popularDishes: { type: String },
  description: { type: String }
});

// Schema for each day in the trip itinerary
const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  activities: [ActivitySchema],
  transits: [TransitSegmentSchema],
  hotels: [HotelSchema],
  sightseeing: [SightseeingSchema],
  restaurants: [RestaurantSchema],
  weather: {
    tempCelsius: { type: Number },
    condition: { type: String },
    description: { type: String },
    iconCode: { type: String }
  }
});

// Main Trip schema
const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User owner is required']
  },
  title: {
    type: String,
    required: [true, 'Trip title is required']
  },
  sourcePlace: {
    type: String,
    required: [true, 'Starting source place is required']
  },
  destinations: [{
    name: { type: String, required: true },
    stayDurationDays: { type: Number, required: true }
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  budget: {
    mode: {
      type: String,
      enum: ['tier', 'daily_limit', 'total_cap'],
      required: true
    },
    tier: {
      type: String,
      enum: ['budget', 'moderate', 'luxury']
    },
    limitAmount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    }
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Custom validations
TripSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'End date must be on or after start date');
  }
  
  if (this.budget) {
    if (this.budget.mode === 'tier' && !this.budget.tier) {
      this.invalidate('budget.tier', 'Budget tier is required when mode is tier');
    }
    if ((this.budget.mode === 'daily_limit' || this.budget.mode === 'total_cap') && !this.budget.limitAmount) {
      this.invalidate('budget.limitAmount', 'Budget limit amount is required when mode is daily_limit or total_cap');
    }
  }
  
  if (!this.destinations || this.destinations.length === 0) {
    this.invalidate('destinations', 'At least one destination is required');
  }

  next();
});

module.exports = mongoose.model('Trip', TripSchema);
