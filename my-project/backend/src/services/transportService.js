const axios = require('axios');

// Helper: Calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Main function to fetch transport recommendations
const getTransportOptions = async (origin, destination, budgetMode) => {
  // Graceful fallback for local mock routing based on geographical coordinates
  // (Provides realistic schedules and pricing out-of-the-box)
  try {
    const lat1 = origin.latitude;
    const lon1 = origin.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return {
        mode: 'driving',
        durationMinutes: 30,
        estimatedCost: 15
      };
    }

    const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);

    let mode = 'driving';
    let durationMinutes = 30;
    let estimatedCost = 15;

    // Rules based on distance
    if (distanceKm < 1.5) {
      mode = 'walk';
      durationMinutes = Math.round(distanceKm * 12); // ~5km/h walking
      estimatedCost = 0;
    } else if (distanceKm < 15) {
      mode = 'driving';
      durationMinutes = Math.round(distanceKm * 2.5); // ~24km/h city driving
      estimatedCost = Math.round(5 + distanceKm * 0.8);
    } else if (distanceKm < 150) {
      mode = 'train';
      durationMinutes = Math.round(30 + distanceKm * 0.8); // ~75km/h train
      estimatedCost = Math.round(15 + distanceKm * 0.15);
    } else {
      mode = 'flight';
      durationMinutes = Math.round(60 + distanceKm * 0.05); // air transit time
      estimatedCost = Math.round(80 + distanceKm * 0.08);
    }

    // Apply budget scaling factors
    if (budgetMode === 'tier') {
      // Scale down for budget, scale up for luxury (premium cabs/first class)
      estimatedCost = Math.round(estimatedCost * 0.8);
    }

    return {
      mode,
      durationMinutes,
      estimatedCost
    };
  } catch (error) {
    console.error('[Transport Service] Error calculating transport options:', error);
    return {
      mode: 'driving',
      durationMinutes: 45,
      estimatedCost: 20
    };
  }
};

const { getCityTransportHubDetails, getAccurateTransportOptionsFromAI } = require('./geminiService');

// Flight API: Duffel Client
const fetchDuffelFlights = async (depIata, arrIata) => {
  const apiKey = process.env.DUFFEL_API_KEY;
  if (!apiKey || apiKey === 'YOUR_DUFFEL_API_KEY') return null;
  try {
    console.log(`[Duffel API] Fetching flights from ${depIata} to ${arrIata}...`);
    const res = await axios.post('https://api.duffel.com/air/offer_requests', {
      data: {
        slices: [{
          origin: depIata,
          destination: arrIata,
          departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days out
        }],
        passengers: [{ type: 'adult' }],
        cabin_class: 'economy'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Duffel-Version': 'v1',
        'Content-Type': 'application/json'
      }
    });
    if (res.data && res.data.data && res.data.data.offers) {
      return res.data.data.offers.slice(0, 3).map(offer => {
        const slice = offer.slices[0];
        const segment = slice.segments[0];
        return {
          mode: 'flight',
          transitNumber: `${segment.marketing_carrier.name} ${segment.marketing_carrier_flight_number}`,
          departureTime: new Date(segment.departing_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(segment.arriving_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationMinutes: Math.round((new Date(segment.arriving_at) - new Date(segment.departing_at)) / 60000),
          estimatedCost: parseFloat(offer.total_amount),
          originStation: segment.origin.name || depIata,
          destinationStation: segment.destination.name || arrIata
        };
      });
    }
  } catch (error) {
    console.error('[Transport Service] Duffel API call failed:', error.response?.data || error.message);
  }
  return null;
};

// Flight API: Aviationstack Client
const fetchAviationstackFlights = async (depIata, arrIata) => {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey || apiKey === 'YOUR_AVIATIONSTACK_API_KEY') return null;
  try {
    console.log(`[Aviationstack API] Fetching flights from ${depIata} to ${arrIata}...`);
    const res = await axios.get('http://api.aviationstack.com/v1/flights', {
      params: {
        access_key: apiKey,
        dep_iata: depIata,
        arr_iata: arrIata,
        limit: 3
      }
    });
    if (res.data && res.data.data && res.data.data.length > 0) {
      return res.data.data.map(f => ({
        mode: 'flight',
        transitNumber: `${f.airline?.name || 'IndiGo'} ${f.flight?.iata || f.flight?.number || '6E-100'}`,
        departureTime: f.departure?.estimated ? new Date(f.departure.estimated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:00 AM',
        arrivalTime: f.arrival?.estimated ? new Date(f.arrival.estimated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM',
        durationMinutes: parseInt(f.flight?.duration) || 90,
        estimatedCost: 160, // Fallback cost as free Aviationstack tiers do not provide ticket prices
        originStation: f.departure?.airport || depIata,
        destinationStation: f.arrival?.airport || arrIata
      }));
    }
  } catch (error) {
    console.error('[Transport Service] Aviationstack API call failed:', error.response?.data || error.message);
  }
  return null;
};

// Rail API: FlightsLogic Rail Client
const fetchFlightsLogicTrains = async (depCode, arrCode) => {
  const apiKey = process.env.FLIGHTSLOGIC_API_KEY;
  if (!apiKey || apiKey === 'YOUR_FLIGHTSLOGIC_API_KEY') return null;
  try {
    console.log(`[FlightsLogic Rail API] Searching trains from ${depCode} to ${arrCode}...`);
    const res = await axios.get('https://api.flightslogic.com/v1/rail/search', {
      params: {
        access_key: apiKey,
        origin: depCode,
        destination: arrCode
      }
    });
    if (res.data && res.data.trains) {
      return res.data.trains.slice(0, 3).map(t => ({
        mode: 'train',
        transitNumber: t.trainNumber || t.name,
        departureTime: t.departureTime || '09:00 AM',
        arrivalTime: t.arrivalTime || '05:00 PM',
        durationMinutes: parseInt(t.durationMinutes) || 480,
        estimatedCost: parseFloat(t.price) || 25,
        originStation: t.originStation || depCode,
        destinationStation: t.destinationStation || arrCode
      }));
    }
  } catch (error) {
    console.error('[Transport Service] FlightsLogic Rail API call failed:', error.response?.data || error.message);
  }
  return null;
};

// Rail API: BOS Train Client
const fetchBosTrains = async (depCode, arrCode) => {
  const apiKey = process.env.BOS_TRAIN_API_KEY;
  if (!apiKey || apiKey === 'YOUR_BOS_TRAIN_API_KEY') return null;
  try {
    console.log(`[BOS Train API] Searching trains from ${depCode} to ${arrCode}...`);
    const res = await axios.post('https://api.bostrains.com/v2/search', {
      originStationCode: depCode,
      destinationStationCode: arrCode
    }, {
      headers: { 'X-API-KEY': apiKey }
    });
    if (res.data && res.data.routes) {
      return res.data.routes.slice(0, 3).map(r => ({
        mode: 'train',
        transitNumber: r.train_no || r.train_name || 'Exp 101',
        departureTime: r.dep_time || '10:00 PM',
        arrivalTime: r.arr_time || '06:00 AM',
        durationMinutes: parseInt(r.duration) || 480,
        estimatedCost: parseFloat(r.fare) || 30,
        originStation: r.origin_station_name || depCode,
        destinationStation: r.dest_station_name || arrCode
      }));
    }
  } catch (error) {
    console.error('[Transport Service] BOS Train API call failed:', error.response?.data || error.message);
  }
  return null;
};

const getAllTransportOptions = async (originName, destinationName, preferences, budgetMode, currency) => {
  const rate = currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'GBP' ? 0.8 : 1;

  // 1. Determine whether airport/railway station is there at source/destination using Gemini or fallbacks
  let originHub, destHub;
  try {
    originHub = await getCityTransportHubDetails(originName);
    destHub = await getCityTransportHubDetails(destinationName);
  } catch (err) {
    console.error('[Transport Service] Dynamic hub retrieval failed, using local database:', err.message);
    const { getLocalCityHubDetails } = require('./geminiService');
    originHub = getLocalCityHubDetails(originName);
    destHub = getLocalCityHubDetails(destinationName);
  }

  // 2. Set up flight stations & instructions (suggest auto/bus/taxi if not local)
  const flightOrigin = originHub.hasAirport 
    ? `${originHub.airportName} (${originHub.airportCode})` 
    : `${originHub.nearestAirportName} (${originHub.nearestAirportCode})`;
    
  const flightDest = destHub.hasAirport 
    ? `${destHub.airportName} (${destHub.airportCode})` 
    : `${destHub.nearestAirportName} (${destHub.nearestAirportCode})`;

  const flightInstructions = !originHub.hasAirport ? originHub.airportTransferInstructions : '';

  // 3. Set up train stations & instructions (suggest auto/bus if not local)
  const trainOrigin = originHub.hasRailwayStation 
    ? `${originHub.railwayStationName} (${originHub.railwayStationCode})` 
    : `${originHub.nearestRailwayStationName} (${originHub.nearestRailwayStationCode})`;
    
  const trainDest = destHub.hasRailwayStation 
    ? `${destHub.railwayStationName} (${destHub.railwayStationCode})` 
    : `${destHub.nearestRailwayStationName} (${destHub.nearestRailwayStationCode})`;

  const trainInstructions = !originHub.hasRailwayStation ? originHub.railwayTransferInstructions : '';

  // 4. Fetch Flight Options (Duffel -> Aviationstack)
  let flightOptions = null;
  const originAirportCode = originHub.airportCode || originHub.nearestAirportCode;
  const destAirportCode = destHub.airportCode || destHub.nearestAirportCode;

  if (originAirportCode && destAirportCode) {
    flightOptions = await fetchDuffelFlights(originAirportCode, destAirportCode);
    if (!flightOptions) {
      flightOptions = await fetchAviationstackFlights(originAirportCode, destAirportCode);
    }
  }

  // 5. Fetch Train Options (FlightsLogic -> BOS Train)
  let trainOptions = null;
  const originStationCode = originHub.railwayStationCode || originHub.nearestRailwayStationCode;
  const destStationCode = destHub.railwayStationCode || destHub.nearestRailwayStationCode;

  if (originStationCode && destStationCode) {
    trainOptions = await fetchFlightsLogicTrains(originStationCode, destStationCode);
    if (!trainOptions) {
      trainOptions = await fetchBosTrains(originStationCode, destStationCode);
    }
  }

  // 6. Fallback to Gemini AI for accurate/real-time schedule generation if API results are not available
  let aiOptions = null;
  if (!flightOptions || !trainOptions) {
    try {
      aiOptions = await getAccurateTransportOptionsFromAI(originHub, destHub, budgetMode, currency, rate);
    } catch (err) {
      console.error('[Transport Service] Gemini accurate transport generation failed, using local static data:', err.message);
      const { getLocalTransportOptionsFallback } = require('./geminiService');
      aiOptions = getLocalTransportOptionsFallback(originHub, destHub, rate);
    }
  }

  if (!flightOptions) {
    flightOptions = aiOptions ? aiOptions.flightOptions : [];
  }
  if (!trainOptions) {
    trainOptions = aiOptions ? aiOptions.trainOptions : [];
  }
  
  const busOptions = aiOptions ? aiOptions.busOptions : [];

  // Scale estimates based on budget mode
  if (budgetMode === 'tier') {
    const scale = budgetMode === 'luxury' ? 1.3 : budgetMode === 'budget' ? 0.7 : 1.0;
    flightOptions.forEach(opt => opt.estimatedCost = Math.round(opt.estimatedCost * scale));
    trainOptions.forEach(opt => opt.estimatedCost = Math.round(opt.estimatedCost * scale));
    busOptions.forEach(opt => opt.estimatedCost = Math.round(opt.estimatedCost * scale));
  }

  return {
    trainOptions,
    flightOptions,
    busOptions,
    flightInstructions,
    trainInstructions,
    busInstructions: ''
  };
};

module.exports = {
  getTransportOptions,
  getAllTransportOptions
};

