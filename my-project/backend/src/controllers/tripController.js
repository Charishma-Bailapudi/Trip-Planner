const Trip = require('../models/Trip');
const { generateItinerary } = require('../services/geminiService');
const { getWeatherData } = require('../services/weatherService');
const { getTransportOptions } = require('../services/transportService');

// Create a new trip with AI itinerary
const createTrip = async (req, res, next) => {
  try {
    const { title, destinations, startDate, endDate, budget, transportPreferences, tripStructure } = req.body;

    // Validate request inputs (Mongoose validations run later, but let's check basic requirements)
    if (!title || !destinations || !startDate || !endDate || !budget || !tripStructure) {
      res.status(400);
      throw new Error('Please provide all mandatory trip parameters');
    }

    // Call Gemini Service to generate the itinerary
    console.log(`[Trip Controller] Requesting AI itinerary generation for: "${title}"`);
    const rawItinerary = await generateItinerary(req.body);

    // Fetch and calculate extra details (weather + transport recalculations)
    const itinerary = [];
    for (const day of rawItinerary) {
      // 1. Fetch weather forecast for this day's primary activity location
      let weatherInfo = null;
      if (day.activities && day.activities.length > 0) {
        const firstAct = day.activities[0];
        try {
          const fullWeather = await getWeatherData(
            firstAct.location.latitude,
            firstAct.location.longitude
          );
          // Find matching date in forecast array, otherwise default to day 0
          weatherInfo = fullWeather.forecast.find(f => f.date === day.dateString) || fullWeather.forecast[0];
        } catch (err) {
          console.error('[Trip Controller] Weather fetch skipped due to error:', err.message);
        }
      }

      // 2. Validate/calculate transits between sequential activities
      const transits = [];
      if (day.activities && day.activities.length > 1) {
        for (let idx = 0; idx < day.activities.length - 1; idx++) {
          const act1 = day.activities[idx];
          const act2 = day.activities[idx + 1];
          try {
            const transitOpt = await getTransportOptions(
              act1.location,
              act2.location,
              budget.mode
            );
            
            // Format mock schedules
            const depHour = 9 + idx * 3;
            const depTime = `${depHour.toString().padStart(2, '0')}:00 ${depHour >= 12 ? 'PM' : 'AM'}`;
            const arrMins = transitOpt.durationMinutes;
            const arrHour = depHour + Math.floor((arrMins) / 60);
            const arrMinVal = arrMins % 60;
            const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMinVal.toString().padStart(2, '0')} ${arrHour >= 12 ? 'PM' : 'AM'}`;

            transits.push({
              origin: act1.location.name,
              destination: act2.location.name,
              mode: transitOpt.mode,
              durationMinutes: transitOpt.durationMinutes,
              estimatedCost: transitOpt.estimatedCost,
              transitNumber: transitOpt.mode === 'train' ? `Train TR-${100 + idx}` : transitOpt.mode === 'flight' ? `Flight FL-${200 + idx}` : transitOpt.mode === 'bus' ? `Bus B-${10 + idx}` : 'Local Transit',
              departureTime: depTime,
              arrivalTime: arrTime,
              originStation: `${act1.location.name} Station`,
              destinationStation: `${act2.location.name} Station`
            });
          } catch (err) {
            transits.push({
              origin: act1.location.name,
              destination: act2.location.name,
              mode: transportPreferences[0] || 'driving',
              durationMinutes: 20,
              estimatedCost: 10,
              transitNumber: 'Local Route',
              departureTime: '12:00 PM',
              arrivalTime: '12:20 PM',
              originStation: `${act1.location.name} Terminal`,
              destinationStation: `${act2.location.name} Terminal`
            });
          }
        }
      } else {
        // Fallback or copy existing transits if only 1 activity
        transits.push(...(day.transits || []));
      }

      itinerary.push({
        dayNumber: day.dayNumber,
        date: new Date(day.dateString),
        activities: day.activities,
        transits,
        weather: weatherInfo
      });
    }

    // Create and save new Trip document
    const trip = new Trip({
      title,
      destinations,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget,
      transportPreferences,
      tripStructure,
      itinerary
    });

    const savedTrip = await trip.save();
    console.log(`[Trip Controller] Successfully generated and saved trip "${title}" (ID: ${savedTrip._id})`);
    
    res.status(201).json(savedTrip);
  } catch (error) {
    next(error);
  }
};

// List all trips (brief metadata only)
const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({}, { title: 1, destinations: 1, startDate: 1, endDate: 1, 'budget.mode': 1, createdAt: 1 }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

// Get single trip by ID with full itinerary
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

// Delete a trip
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }
    res.json({ success: true, message: 'Trip successfully deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip
};
