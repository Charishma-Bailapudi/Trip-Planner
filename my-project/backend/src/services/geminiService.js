const { GoogleGenerativeAI } = require('@google/generative-ai');

// JSON schema mapping to ItineraryDay, Activity, and Transit schemas
const itineraryResponseSchema = {
  type: 'ARRAY',
  description: 'List of daily itineraries for the trip',
  items: {
    type: 'OBJECT',
    properties: {
      dayNumber: { type: 'INTEGER' },
      dateString: { type: 'STRING', description: 'ISO date string (YYYY-MM-DD) for this day' },
      activities: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            timeSlot: { type: 'STRING', description: 'Time of day e.g. Morning, Afternoon, Evening, 10:00 AM' },
            title: { type: 'STRING' },
            description: { type: 'STRING' },
            location: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                latitude: { type: 'NUMBER' },
                longitude: { type: 'NUMBER' }
              },
              required: ['name', 'latitude', 'longitude']
            },
            cost: { type: 'NUMBER', description: 'Estimated cost in USD' }
          },
          required: ['timeSlot', 'title', 'description', 'location', 'cost']
        }
      },
      transits: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            origin: { type: 'STRING' },
            destination: { type: 'STRING' },
            mode: { type: 'STRING', description: 'Mode of transport, e.g. flight, train, bus, walk, driving' },
            durationMinutes: { type: 'INTEGER' },
            estimatedCost: { type: 'NUMBER' },
            transitNumber: { type: 'STRING', description: 'Identify specific train number (e.g. Train T9201), flight number (e.g. Flight LH-432), or bus number if applicable' },
            departureTime: { type: 'STRING', description: 'Departure time, e.g. "08:30 AM" or "14:15"' },
            arrivalTime: { type: 'STRING', description: 'Arrival time, e.g. "10:45 AM" or "16:30"' },
            originStation: { type: 'STRING', description: 'Name of departure station or airport, e.g. London St Pancras or JFK Airport' },
            destinationStation: { type: 'STRING', description: 'Name of arrival station or airport, e.g. Paris Gare du Nord or Heathrow Airport' }
          },
          required: ['origin', 'destination', 'mode', 'durationMinutes', 'estimatedCost', 'transitNumber', 'departureTime', 'arrivalTime', 'originStation', 'destinationStation']
        }
      }
    },
    required: ['dayNumber', 'dateString', 'activities', 'transits']
  }
};

// Generates an itinerary using Gemini 1.5 Flash
const generateItinerary = async (tripData) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn('[Gemini Service] GEMINI_API_KEY is not set. Falling back to Mock Itinerary.');
    return generateMockItinerary(tripData);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: itineraryResponseSchema
      }
    });

    const prompt = `Generate a detailed day-wise travel itinerary for a trip titled "${tripData.title}".
    
    Travel Details:
    - Destinations: ${JSON.stringify(tripData.destinations)}
    - Start Date: ${tripData.startDate}
    - End Date: ${tripData.endDate}
    - Budget Preference: Mode is "${tripData.budget.mode}" with values: ${JSON.stringify(tripData.budget)} (Requested Currency is: ${tripData.budget.currency || 'USD'})
    - Transport Preferences: ${JSON.stringify(tripData.transportPreferences)}
    - Trip Layout Structure: "${tripData.tripStructure}" (linear = chronological destination stays, hub_and_spoke = base destination with daily side trips, flex = unstructured optimal ordering)

    Instructions:
    1. Plan a realistic and logical timeline for each day.
    2. Suggest 2-3 activities per day. For each activity provide location name, approximate coordinates (latitude and longitude), and a cost estimate in the requested currency (${tripData.budget.currency || 'USD'}) aligning with the budget mode.
    3. Suggest logical transit legs between activities or locations using the specified transport preferences. For every transit leg (flights, trains, buses), you MUST invent realistic transport numbers (e.g. train number like "Train TGV-9012", flight number like "Flight BA-234"), select logical departure and arrival times, specify the names of origin/destination stations or airports, and estimate costs in the requested currency (${tripData.budget.currency || 'USD'}).
    4. Return ONLY the JSON array matching the schema.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('[Gemini Service] Error generating itinerary with Gemini API:', error);
    console.warn('[Gemini Service] Falling back to Mock Itinerary due to API error.');
    return generateMockItinerary(tripData);
  }
};

// Generates high-quality mock itineraries to guarantee local correctness/testing
function generateMockItinerary(tripData) {
  const { startDate, endDate, destinations } = tripData;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const itinerary = [];
  
  // Rate calculation for mock costs
  const rate = tripData.budget.currency === 'INR' ? 80 : tripData.budget.currency === 'EUR' ? 0.9 : tripData.budget.currency === 'GBP' ? 0.8 : 1;

  // Coordinates helper mock values for common cities
  const cityCoords = {
    paris: { lat: 48.8566, lng: 2.3522 },
    rose: { lat: 41.9028, lng: 12.4964 },
    rome: { lat: 41.9028, lng: 12.4964 },
    london: { lat: 51.5074, lng: -0.1278 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    new_york: { lat: 40.7128, lng: -74.0060 }
  };

  const getCoords = (cityName) => {
    const key = cityName.toLowerCase().replace(/\s+/g, '_');
    if (cityCoords[key]) return cityCoords[key];
    // Random offset if city is unknown
    return {
      lat: 40 + (Math.random() - 0.5) * 5,
      lng: -70 + (Math.random() - 0.5) * 5
    };
  };

  const primaryDest = destinations[0] ? destinations[0].name : 'Destination';
  const baseCoords = getCoords(primaryDest);

  for (let i = 1; i <= durationDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (i - 1));

    // Determine current destination day-wise
    let currentCity = primaryDest;
    let accumDays = 0;
    for (const dest of destinations) {
      accumDays += dest.stayDurationDays;
      if (i <= accumDays) {
        currentCity = dest.name;
        break;
      }
    }

    const cityLocation = getCoords(currentCity);

    const baseCost = tripData.budget.mode === 'tier' && tripData.budget.tier === 'luxury' ? 80 : 20;
    const culinaryCost = tripData.budget.mode === 'tier' && tripData.budget.tier === 'budget' ? 10 : 35;

    itinerary.push({
      dayNumber: i,
      dateString: currentDate.toISOString().split('T')[0],
      activities: [
        {
          timeSlot: 'Morning',
          title: `Explore historical highlights of ${currentCity}`,
          description: `Visit key landmarks in the heart of ${currentCity}.`,
          location: {
            name: `${currentCity} City Center`,
            latitude: cityLocation.lat,
            longitude: cityLocation.lng
          },
          cost: Math.round(baseCost * rate)
        },
        {
          timeSlot: 'Afternoon',
          title: `Local Culinary Experience`,
          description: `Sample local foods and delicacies at highly-rated spots.`,
          location: {
            name: `${currentCity} Market District`,
            latitude: cityLocation.lat + 0.005,
            longitude: cityLocation.lng - 0.004
          },
          cost: Math.round(culinaryCost * rate)
        }
      ],
      transits: [
        {
          origin: `${currentCity} City Center`,
          destination: `${currentCity} Market District`,
          mode: tripData.transportPreferences[0] || 'walk',
          durationMinutes: 15,
          estimatedCost: Math.round(5 * rate),
          transitNumber: tripData.transportPreferences[0] === 'train' ? 'Train TGV-9012' : tripData.transportPreferences[0] === 'flight' ? 'Flight AF-120' : 'Bus B-89',
          departureTime: '10:15 AM',
          arrivalTime: '10:30 AM',
          originStation: `${currentCity} Central Station`,
          destinationStation: `${currentCity} Market Plaza`
        }
      ]
    });
  }

  return itinerary;
}

module.exports = {
  generateItinerary
};
