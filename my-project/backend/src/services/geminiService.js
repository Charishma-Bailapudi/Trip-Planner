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
  generateItinerary,
  getCityTransportHubDetails,
  getAccurateTransportOptionsFromAI,
  getLocalCityHubDetails,
  getLocalTransportOptionsFallback
};

// --- New Schemas and Functions for Airport/Railway station lookup and transport options ---

const hubResponseSchema = {
  type: 'OBJECT',
  properties: {
    hasAirport: { type: 'BOOLEAN' },
    airportName: { type: 'STRING', description: 'Official name of the airport in this city, or null if there is no commercial airport' },
    airportCode: { type: 'STRING', description: '3-letter IATA code of the airport, or null' },
    nearestAirportName: { type: 'STRING', description: 'Nearest commercial airport name if this city has no airport' },
    nearestAirportCode: { type: 'STRING', description: 'IATA code of the nearest airport' },
    airportDistanceKm: { type: 'NUMBER', description: 'Distance in kilometers to the nearest airport, 0 if hasAirport is true' },
    airportTransferInstructions: { type: 'STRING', description: 'Detailed instruction on how to travel to the airport. If there is no airport, suggest taking an auto, taxi, or bus to reach the nearest airport' },
    hasRailwayStation: { type: 'BOOLEAN' },
    railwayStationName: { type: 'STRING', description: 'Official name of the railway station, or null if there is no railway station' },
    railwayStationCode: { type: 'STRING', description: 'Station code, or null' },
    nearestRailwayStationName: { type: 'STRING', description: 'Nearest railway station name if this city has no railway station' },
    nearestRailwayStationCode: { type: 'STRING', description: 'Station code of the nearest railway station' },
    railwayDistanceKm: { type: 'NUMBER', description: 'Distance in kilometers to the nearest railway station, 0 if hasRailwayStation is true' },
    railwayTransferInstructions: { type: 'STRING', description: 'Detailed instruction on how to travel to the railway station. If there is no local railway station, suggest taking an auto or bus to reach the nearest railway station' }
  },
  required: [
    'hasAirport', 'airportName', 'airportCode', 'nearestAirportName', 'nearestAirportCode', 
    'airportDistanceKm', 'airportTransferInstructions', 'hasRailwayStation', 'railwayStationName', 
    'railwayStationCode', 'nearestRailwayStationName', 'nearestRailwayStationCode', 
    'railwayDistanceKm', 'railwayTransferInstructions'
  ]
};

const transportOptionsSchema = {
  type: 'OBJECT',
  properties: {
    trainOptions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          mode: { type: 'STRING' },
          transitNumber: { type: 'STRING', description: 'Train number and name, e.g. "Godavari Express 12727"' },
          departureTime: { type: 'STRING', description: 'Departure time, e.g. "05:40 PM"' },
          arrivalTime: { type: 'STRING', description: 'Arrival time, e.g. "06:15 AM"' },
          durationMinutes: { type: 'INTEGER' },
          estimatedCost: { type: 'NUMBER' },
          originStation: { type: 'STRING', description: 'Origin railway station name with code, e.g. "Anakapalle (AKP)"' },
          destinationStation: { type: 'STRING', description: 'Destination railway station name with code, e.g. "Secunderabad (SC)"' }
        },
        required: ['mode', 'transitNumber', 'departureTime', 'arrivalTime', 'durationMinutes', 'estimatedCost', 'originStation', 'destinationStation']
      }
    },
    flightOptions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          mode: { type: 'STRING' },
          transitNumber: { type: 'STRING', description: 'Flight operator and number, e.g. "IndiGo 6E-243"' },
          departureTime: { type: 'STRING', description: 'Departure time, e.g. "01:45 PM"' },
          arrivalTime: { type: 'STRING', description: 'Arrival time, e.g. "03:00 PM"' },
          durationMinutes: { type: 'INTEGER' },
          estimatedCost: { type: 'NUMBER' },
          originStation: { type: 'STRING', description: 'Origin airport name with IATA code, e.g. "Visakhapatnam Airport (VTZ)"' },
          destinationStation: { type: 'STRING', description: 'Destination airport name with IATA code, e.g. "Rajiv Gandhi Airport (HYD)"' }
        },
        required: ['mode', 'transitNumber', 'departureTime', 'arrivalTime', 'durationMinutes', 'estimatedCost', 'originStation', 'destinationStation']
      }
    },
    busOptions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          mode: { type: 'STRING' },
          transitNumber: { type: 'STRING', description: 'Bus type and company, e.g. "APSRTC Volvo Multi-Axle"' },
          departureTime: { type: 'STRING', description: 'Departure time, e.g. "08:00 PM"' },
          arrivalTime: { type: 'STRING', description: 'Arrival time, e.g. "06:00 AM"' },
          durationMinutes: { type: 'INTEGER' },
          estimatedCost: { type: 'NUMBER' },
          originStation: { type: 'STRING', description: 'Departure bus stand, e.g. "Anakapalle Bypass"' },
          destinationStation: { type: 'STRING', description: 'Arrival bus stand, e.g. "Miyapur Bus Stand"' }
        },
        required: ['mode', 'transitNumber', 'departureTime', 'arrivalTime', 'durationMinutes', 'estimatedCost', 'originStation', 'destinationStation']
      }
    }
  },
  required: ['trainOptions', 'flightOptions', 'busOptions']
};

async function getCityTransportHubDetails(cityName) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn('[Gemini Service] GEMINI_API_KEY is not set. Falling back to local hub mapping.');
    return getLocalCityHubDetails(cityName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: hubResponseSchema
      }
    });

    const prompt = `Analyze the city: "${cityName}". Determine if it has a commercial airport and a railway station.
    Provide the official station/airport names and codes (like 3-letter IATA code for airport, e.g., VTZ, and station code for railway station, e.g., AKP or MAS).
    If it DOES NOT have an airport or railway station, identify the nearest one, its distance in km, and suggest specific transfer instructions recommending the user to take an auto, taxi, or bus to reach it.
    Return the output strictly in the requested JSON structure.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('[Gemini Service] Error checking transport hubs with Gemini API:', error);
    return getLocalCityHubDetails(cityName);
  }
}

async function getAccurateTransportOptionsFromAI(originHub, destHub, budgetMode, currency, rate) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn('[Gemini Service] GEMINI_API_KEY is not set. Falling back to local/default transport option generators.');
    return getLocalTransportOptionsFallback(originHub, destHub, rate);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: transportOptionsSchema
      }
    });

    const originName = originHub.hasAirport ? originHub.airportName : originHub.nearestAirportName;
    const originIata = originHub.hasAirport ? originHub.airportCode : originHub.nearestAirportCode;
    const destName = destHub.hasAirport ? destHub.airportName : destHub.nearestAirportName;
    const destIata = destHub.hasAirport ? destHub.airportCode : destHub.nearestAirportCode;

    const originStationName = originHub.hasRailwayStation ? originHub.railwayStationName : originHub.nearestRailwayStationName;
    const originStationCode = originHub.hasRailwayStation ? originHub.railwayStationCode : originHub.nearestRailwayStationCode;
    const destStationName = destHub.hasRailwayStation ? destHub.railwayStationName : destHub.nearestRailwayStationName;
    const destStationCode = destHub.hasRailwayStation ? destHub.railwayStationCode : destHub.nearestRailwayStationCode;

    const prompt = `Generate a list of 3 train options, 3 flight options, and 2 bus options between these locations:
    
    Flight Route (Airport to Airport):
    - Origin Airport: "${originName} (${originIata})"
    - Destination Airport: "${destName} (${destIata})"
    
    Rail Route (Station to Station):
    - Origin Station: "${originStationName} (${originStationCode})"
    - Destination Station: "${destStationName} (${destStationCode})"
    
    Budget settings:
    - Mode: ${budgetMode}
    - Currency: ${currency} (Scale estimated costs properly for this currency. For example, if currency is INR, average flights should be 4000-8000 INR, trains 500-2000 INR, buses 600-1500 INR).
    
    Instructions:
    1. Search your knowledge base to fetch real or highly accurate actual trains that run on this route (e.g. if routes are in India, specify real trains like "Godavari Express 12727" or "Vande Bharat Express 20833").
    2. Suggest realistic flight options (e.g., flight numbers like "IndiGo 6E-243" or "Air India AI-501") with proper departure and arrival times and durations.
    3. Return the response matching the requested JSON structure.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('[Gemini Service] Error generating transport options with Gemini API:', error);
    return getLocalTransportOptionsFallback(originHub, destHub, rate);
  }
}

function getLocalCityHubDetails(cityName) {
  const key = cityName.toLowerCase().trim();
  
  const localHubs = {
    anakapalle: {
      hasAirport: false,
      airportName: null,
      airportCode: null,
      nearestAirportName: 'Visakhapatnam Airport',
      nearestAirportCode: 'VTZ',
      airportDistanceKm: 35,
      airportTransferInstructions: 'Note: Anakapalle does not have a commercial airport. Please take an auto, taxi, or bus to Visakhapatnam Airport (VTZ) (approx 35 km, 50 mins) to board your flight.',
      hasRailwayStation: true,
      railwayStationName: 'Anakapalle Railway Station',
      railwayStationCode: 'AKP',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Anakapalle is served by Anakapalle Railway Station (AKP).'
    },
    guntur: {
      hasAirport: false,
      airportName: null,
      airportCode: null,
      nearestAirportName: 'Vijayawada Airport',
      nearestAirportCode: 'VGA',
      airportDistanceKm: 50,
      airportTransferInstructions: 'Note: Guntur does not have a commercial airport. Please take an auto, taxi, or bus to Vijayawada Airport (VGA) (approx 50 km, 1 hour) to board your flight.',
      hasRailwayStation: true,
      railwayStationName: 'Guntur Railway Station',
      railwayStationCode: 'GNT',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Guntur is served directly by Guntur Railway Station (GNT).'
    },
    visakhapatnam: {
      hasAirport: true,
      airportName: 'Visakhapatnam Airport',
      airportCode: 'VTZ',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Visakhapatnam is served directly by Visakhapatnam Airport (VTZ).',
      hasRailwayStation: true,
      railwayStationName: 'Visakhapatnam Railway Junction',
      railwayStationCode: 'VSKP',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Visakhapatnam is served directly by Visakhapatnam Railway Junction (VSKP).'
    },
    hyderabad: {
      hasAirport: true,
      airportName: 'Rajiv Gandhi International Airport',
      airportCode: 'HYD',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Hyderabad is served directly by Rajiv Gandhi International Airport (HYD).',
      hasRailwayStation: true,
      railwayStationName: 'Secunderabad Railway Station',
      railwayStationCode: 'SC',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Hyderabad is served by Secunderabad Railway Station (SC), Hyderabad Deccan Nampally (HYB), and Kacheguda (KCG).'
    },
    vijayawada: {
      hasAirport: true,
      airportName: 'Vijayawada Airport',
      airportCode: 'VGA',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Vijayawada is served directly by Vijayawada Airport (VGA).',
      hasRailwayStation: true,
      railwayStationName: 'Vijayawada Railway Junction',
      railwayStationCode: 'BZA',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Vijayawada is served directly by Vijayawada Railway Junction (BZA).'
    },
    tirupati: {
      hasAirport: true,
      airportName: 'Tirupati Airport',
      airportCode: 'TIR',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Tirupati is served directly by Tirupati Airport (TIR).',
      hasRailwayStation: true,
      railwayStationName: 'Tirupati Main Station',
      railwayStationCode: 'TPTY',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Tirupati is served directly by Tirupati Main Station (TPTY).'
    },
    bengaluru: {
      hasAirport: true,
      airportName: 'Kempegowda International Airport',
      airportCode: 'BLR',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Bengaluru is served directly by Kempegowda International Airport (BLR).',
      hasRailwayStation: true,
      railwayStationName: 'KSR Bengaluru City Junction',
      railwayStationCode: 'SBC',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Bengaluru is served by KSR Bengaluru City Junction (SBC) and Yesvantpur Junction (YPR).'
    },
    chennai: {
      hasAirport: true,
      airportName: 'Chennai International Airport',
      airportCode: 'MAA',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Chennai is served directly by Chennai International Airport (MAA).',
      hasRailwayStation: true,
      railwayStationName: 'Chennai Central Station',
      railwayStationCode: 'MAS',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Chennai is served by Chennai Central Station (MAS) and Chennai Egmore (MS).'
    },
    mumbai: {
      hasAirport: true,
      airportName: 'Chhatrapati Shivaji Maharaj International Airport',
      airportCode: 'BOM',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Mumbai is served directly by Chhatrapati Shivaji Maharaj International Airport (BOM).',
      hasRailwayStation: true,
      railwayStationName: 'Mumbai Chhatrapati Shivaji Maharaj Terminus',
      railwayStationCode: 'CSMT',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Mumbai is served by CSMT, Mumbai Central (MMCT), and Lokmanya Tilak Terminus (LTT).'
    },
    delhi: {
      hasAirport: true,
      airportName: 'Indira Gandhi International Airport',
      airportCode: 'DEL',
      nearestAirportName: null,
      nearestAirportCode: null,
      airportDistanceKm: 0,
      airportTransferInstructions: 'Delhi is served directly by Indira Gandhi International Airport (DEL).',
      hasRailwayStation: true,
      railwayStationName: 'New Delhi Railway Station',
      railwayStationCode: 'NDLS',
      nearestRailwayStationName: null,
      nearestRailwayStationCode: null,
      railwayDistanceKm: 0,
      railwayTransferInstructions: 'Delhi is served by New Delhi Railway Station (NDLS), Old Delhi (DLI), and Hazrat Nizamuddin (NZM).'
    }
  };

  for (const k of Object.keys(localHubs)) {
    if (key.includes(k)) {
      return localHubs[k];
    }
  }

  return {
    hasAirport: false,
    airportName: null,
    airportCode: null,
    nearestAirportName: `${cityName} Regional Airport`,
    nearestAirportCode: 'APX',
    airportDistanceKm: 60,
    airportTransferInstructions: `Note: ${cityName} does not have a commercial airport. Please take an auto or taxi (approx 60 km) to reach the nearest airport (${cityName} Regional Airport - APX) to board your flight.`,
    hasRailwayStation: false,
    railwayStationName: null,
    railwayStationCode: null,
    nearestRailwayStationName: `${cityName} Road Station`,
    nearestRailwayStationCode: 'JNX',
    railwayDistanceKm: 15,
    railwayTransferInstructions: `Note: ${cityName} does not have a local railway station. Please take an auto (approx 15 km) to reach the nearest station (${cityName} Road Station - JNX) to board your train.`
  };
}

function getLocalTransportOptionsFallback(originHub, destHub, rate) {
  const originCode = originHub.airportCode || originHub.nearestAirportCode || 'VTZ';
  const destCode = destHub.airportCode || destHub.nearestAirportCode || 'HYD';
  const originStation = originHub.railwayStationCode || originHub.nearestRailwayStationCode || 'AKP';
  const destStation = destHub.railwayStationCode || destHub.nearestRailwayStationCode || 'SC';

  const originName = originHub.airportName || originHub.nearestAirportName || 'Origin Airport';
  const destName = destHub.airportName || destHub.nearestAirportName || 'Destination Airport';
  const originStationName = originHub.railwayStationName || originHub.nearestRailwayStationName || 'Origin Station';
  const destStationName = destHub.railwayStationName || destHub.nearestRailwayStationName || 'Destination Station';

  const isAnakapalleToHyd = (originStation.includes('AKP') && destStation.includes('SC'));

  const trainOptions = isAnakapalleToHyd ? [
    {
      mode: 'train',
      transitNumber: 'Godavari Express 12727',
      departureTime: '05:40 PM',
      arrivalTime: '06:15 AM',
      durationMinutes: 755,
      estimatedCost: Math.round(15 * rate),
      originStation: 'Anakapalle (AKP)',
      destinationStation: 'Secunderabad Jn (SC)'
    },
    {
      mode: 'train',
      transitNumber: 'Janmabhoomi Express 12805',
      departureTime: '06:40 AM',
      arrivalTime: '07:45 PM',
      durationMinutes: 785,
      estimatedCost: Math.round(8 * rate),
      originStation: 'Anakapalle (AKP)',
      destinationStation: 'Secunderabad Jn (SC)'
    },
    {
      mode: 'train',
      transitNumber: 'Visakha Express 17015',
      departureTime: '04:30 PM',
      arrivalTime: '07:30 AM',
      durationMinutes: 900,
      estimatedCost: Math.round(13 * rate),
      originStation: 'Anakapalle (AKP)',
      destinationStation: 'Secunderabad Jn (SC)'
    }
  ] : [
    {
      mode: 'train',
      transitNumber: 'Express Train TR-8802',
      departureTime: '08:00 AM',
      arrivalTime: '01:30 PM',
      durationMinutes: 330,
      estimatedCost: Math.round(30 * rate),
      originStation: `${originStationName} (${originStation})`,
      destinationStation: `${destStationName} (${destStation})`
    },
    {
      mode: 'train',
      transitNumber: 'Superfast Express TR-2022',
      departureTime: '09:30 PM',
      arrivalTime: '03:15 AM',
      durationMinutes: 345,
      estimatedCost: Math.round(65 * rate),
      originStation: `${originStationName} (${originStation})`,
      destinationStation: `${destStationName} (${destStation})`
    }
  ];

  const flightOptions = [
    {
      mode: 'flight',
      transitNumber: 'Air India AI-501',
      departureTime: '06:15 AM',
      arrivalTime: '07:30 AM',
      durationMinutes: 75,
      estimatedCost: Math.round(140 * rate),
      originStation: `${originName} (${originCode})`,
      destinationStation: `${destName} (${destCode})`
    },
    {
      mode: 'flight',
      transitNumber: 'IndiGo 6E-243',
      departureTime: '01:45 PM',
      arrivalTime: '03:00 PM',
      durationMinutes: 75,
      estimatedCost: Math.round(120 * rate),
      originStation: `${originName} (${originCode})`,
      destinationStation: `${destName} (${destCode})`
    }
  ];

  const busOptions = [
    {
      mode: 'bus',
      transitNumber: 'APSRTC Volvo Multi-Axle',
      departureTime: '08:00 PM',
      arrivalTime: '06:00 AM',
      durationMinutes: 600,
      estimatedCost: Math.round(12 * rate),
      originStation: 'Central Bus Stand',
      destinationStation: 'Bypass Bus Stand'
    }
  ];

  return { trainOptions, flightOptions, busOptions };
}
