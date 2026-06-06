const Trip = require('../models/Trip');
const { generateItinerary } = require('../services/geminiService');
const { getWeatherData } = require('../services/weatherService');
const { getTransportOptions, getAllTransportOptions } = require('../services/transportService');

// Create a new trip with AI itinerary
const createTrip = async (req, res, next) => {
  try {
    const { title, sourcePlace, destinations, startDate, endDate, budget, transportPreferences, tripStructure } = req.body;

    // Validate request inputs (Mongoose validations run later, but let's check basic requirements)
    if (!title || !sourcePlace || !destinations || !startDate || !endDate || !budget || !tripStructure) {
      res.status(400);
      throw new Error('Please provide all mandatory trip parameters including sourcePlace');
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
      const rate = budget.currency === 'INR' ? 80 : budget.currency === 'EUR' ? 0.9 : budget.currency === 'GBP' ? 0.8 : 1;
      
      // Prepend initial transit from sourcePlace to Day 1 first activity
      if (day.dayNumber === 1 && sourcePlace && day.activities && day.activities.length > 0) {
        try {
          const startOptions = getAllTransportOptions(
            sourcePlace,
            day.activities[0].location.name,
            transportPreferences,
            budget.mode,
            budget.currency
          );
          if (startOptions.length > 0) {
            const defaultOpt = startOptions[0];
            transits.push({
              origin: sourcePlace,
              destination: day.activities[0].location.name,
              mode: defaultOpt.mode,
              durationMinutes: defaultOpt.durationMinutes,
              estimatedCost: defaultOpt.estimatedCost,
              transitNumber: defaultOpt.transitNumber,
              departureTime: defaultOpt.departureTime,
              arrivalTime: defaultOpt.arrivalTime,
              originStation: defaultOpt.originStation,
              destinationStation: defaultOpt.destinationStation,
              options: startOptions,
              selectedOptionIndex: 0
            });
          }
        } catch (err) {
          console.error('[Trip Controller] Error generating starting transit:', err.message);
        }
      }

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

            const legOptions = getAllTransportOptions(
              act1.location.name,
              act2.location.name,
              transportPreferences,
              budget.mode,
              budget.currency
            );
            const defaultOpt = legOptions[0] || {
              mode: transitOpt.mode,
              durationMinutes: transitOpt.durationMinutes,
              estimatedCost: Math.round(transitOpt.estimatedCost * rate),
              transitNumber: transitOpt.mode === 'train' ? `Train TR-${100 + idx}` : transitOpt.mode === 'flight' ? `Flight FL-${200 + idx}` : transitOpt.mode === 'bus' ? `Bus B-${10 + idx}` : 'Local Transit',
              departureTime: depTime,
              arrivalTime: arrTime,
              originStation: `${act1.location.name} Station`,
              destinationStation: `${act2.location.name} Station`
            };

            transits.push({
              origin: act1.location.name,
              destination: act2.location.name,
              mode: defaultOpt.mode,
              durationMinutes: defaultOpt.durationMinutes,
              estimatedCost: defaultOpt.estimatedCost,
              transitNumber: defaultOpt.transitNumber,
              departureTime: defaultOpt.departureTime,
              arrivalTime: defaultOpt.arrivalTime,
              originStation: defaultOpt.originStation,
              destinationStation: defaultOpt.destinationStation,
              options: legOptions,
              selectedOptionIndex: 0
            });
          } catch (err) {
            const fallbackOptions = getAllTransportOptions(
              act1.location.name,
              act2.location.name,
              transportPreferences,
              budget.mode,
              budget.currency
            );
            const defaultOpt = fallbackOptions[0] || {
              mode: transportPreferences[0] || 'driving',
              durationMinutes: 20,
              estimatedCost: Math.round(10 * rate),
              transitNumber: 'Local Route',
              departureTime: '12:00 PM',
              arrivalTime: '12:20 PM',
              originStation: `${act1.location.name} Terminal`,
              destinationStation: `${act2.location.name} Terminal`
            };
            transits.push({
              origin: act1.location.name,
              destination: act2.location.name,
              mode: defaultOpt.mode,
              durationMinutes: defaultOpt.durationMinutes,
              estimatedCost: defaultOpt.estimatedCost,
              transitNumber: defaultOpt.transitNumber,
              departureTime: defaultOpt.departureTime,
              arrivalTime: defaultOpt.arrivalTime,
              originStation: defaultOpt.originStation,
              destinationStation: defaultOpt.destinationStation,
              options: fallbackOptions,
              selectedOptionIndex: 0
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
      user: req.user._id,
      title,
      sourcePlace,
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
    const trips = await Trip.find({ user: req.user._id }, { title: 1, destinations: 1, startDate: 1, endDate: 1, 'budget.mode': 1, createdAt: 1 }).sort({ createdAt: -1 });
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
    if (trip.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this trip');
    }
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

// Delete a trip
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }
    if (trip.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this trip');
    }
    await trip.deleteOne();
    res.json({ success: true, message: 'Trip successfully deleted' });
  } catch (error) {
    next(error);
  }
};

// Update selected transit option index
const selectTransitOption = async (req, res, next) => {
  try {
    const { id, transitId } = req.params;
    const { optionIndex } = req.body;

    if (optionIndex === undefined) {
      res.status(400);
      throw new Error('Please provide optionIndex');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      res.status(404);
      throw new Error('Trip not found');
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to modify this trip');
    }

    let found = false;
    for (const day of trip.itinerary) {
      const transit = day.transits.id(transitId);
      if (transit) {
        if (optionIndex < 0 || optionIndex >= transit.options.length) {
          res.status(400);
          throw new Error('Invalid option index');
        }

        const selectedOpt = transit.options[optionIndex];
        transit.selectedOptionIndex = optionIndex;
        transit.mode = selectedOpt.mode;
        transit.durationMinutes = selectedOpt.durationMinutes;
        transit.estimatedCost = selectedOpt.estimatedCost;
        transit.transitNumber = selectedOpt.transitNumber;
        transit.departureTime = selectedOpt.departureTime;
        transit.arrivalTime = selectedOpt.arrivalTime;
        transit.originStation = selectedOpt.originStation;
        transit.destinationStation = selectedOpt.destinationStation;
        
        found = true;
        break;
      }
    }

    if (!found) {
      res.status(404);
      throw new Error('Transit segment not found');
    }

    const savedTrip = await trip.save();
    res.json(savedTrip);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip,
  selectTransitOption
};
