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

const citiesHubs = {
  anakapalle: {
    airport: {
      name: 'Visakhapatnam Airport (VTZ)',
      distanceKm: 35,
      transferInstruction: 'Note: Anakapalle does not have an airport. Please take a bus, taxi, or auto to Visakhapatnam Airport (VTZ) (approx 35 km, 50 mins) to board your flight.'
    },
    railway: {
      name: 'Anakapalle Railway Station (AKP)',
      distanceKm: 0,
      transferInstruction: ''
    }
  },
  visakhapatnam: {
    airport: { name: 'Visakhapatnam Airport (VTZ)', distanceKm: 0 },
    railway: { name: 'Visakhapatnam Railway Junction (VSKP)', distanceKm: 0 }
  },
  hyderabad: {
    airport: { name: 'Rajiv Gandhi International Airport (HYD)', distanceKm: 0 },
    railway: { name: 'Secunderabad Railway Station (SC)', distanceKm: 0 }
  },
  vijayawada: {
    airport: { name: 'Vijayawada Airport (VGA)', distanceKm: 0 },
    railway: { name: 'Vijayawada Railway Junction (BZA)', distanceKm: 0 }
  },
  tirupati: {
    airport: { name: 'Tirupati Airport (TIR)', distanceKm: 0 },
    railway: { name: 'Tirupati Main Station (TPTY)', distanceKm: 0 }
  },
  bengaluru: {
    airport: { name: 'Kempegowda International Airport (BLR)', distanceKm: 0 },
    railway: { name: 'KSR Bengaluru City Junction (SBC)', distanceKm: 0 }
  },
  chennai: {
    airport: { name: 'Chennai International Airport (MAA)', distanceKm: 0 },
    railway: { name: 'Chennai Central Station (MAS)', distanceKm: 0 }
  },
  mumbai: {
    airport: { name: 'Chhatrapati Shivaji Maharaj International Airport (BOM)', distanceKm: 0 },
    railway: { name: 'Mumbai Chhatrapati Shivaji Maharaj Terminus (CSMT)', distanceKm: 0 }
  },
  delhi: {
    airport: { name: 'Indira Gandhi International Airport (DEL)', distanceKm: 0 },
    railway: { name: 'New Delhi Railway Station (NDLS)', distanceKm: 0 }
  }
};

const getCityHub = (cityName) => {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  for (const k of Object.keys(citiesHubs)) {
    if (key.includes(k)) {
      return { key: k, ...citiesHubs[k] };
    }
  }
  return null;
};

const getAllTransportOptions = (originName, destinationName, preferences, budgetMode, currency) => {
  const rate = currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'GBP' ? 0.8 : 1;

  const originHub = getCityHub(originName);
  const destHub = getCityHub(destinationName);

  // Setup flight airports & instructions
  const flightOrigin = originHub?.airport?.name || `${originName} Airport`;
  const flightDest = destHub?.airport?.name || `${destinationName} Airport`;
  let flightInstructions = '';
  if (originHub?.airport?.transferInstruction) {
    flightInstructions += originHub.airport.transferInstruction;
  }
  if (destHub?.airport?.transferInstruction) {
    flightInstructions += (flightInstructions ? ' ' : '') + destHub.airport.transferInstruction;
  }

  // Setup railway stations & instructions
  const trainOrigin = originHub?.railway?.name || `${originName} Railway Station`;
  const trainDest = destHub?.railway?.name || `${destinationName} Railway Station`;
  let trainInstructions = '';
  if (originHub?.railway?.transferInstruction) {
    trainInstructions += originHub.railway.transferInstruction;
  }
  if (destHub?.railway?.transferInstruction) {
    trainInstructions += (trainInstructions ? ' ' : '') + destHub.railway.transferInstruction;
  }

  // Generate Flight Options
  const flightOptions = [
    {
      mode: 'flight',
      transitNumber: 'Air India AI-501',
      departureTime: '06:15 AM',
      arrivalTime: '07:30 AM',
      durationMinutes: 75,
      estimatedCost: Math.round(140 * rate),
      originStation: flightOrigin,
      destinationStation: flightDest
    },
    {
      mode: 'flight',
      transitNumber: 'IndiGo 6E-243',
      departureTime: '01:45 PM',
      arrivalTime: '03:00 PM',
      durationMinutes: 75,
      estimatedCost: Math.round(120 * rate),
      originStation: flightOrigin,
      destinationStation: flightDest
    },
    {
      mode: 'flight',
      transitNumber: 'Vistara UK-882',
      departureTime: '07:30 PM',
      arrivalTime: '08:45 PM',
      durationMinutes: 75,
      estimatedCost: Math.round(160 * rate),
      originStation: flightOrigin,
      destinationStation: flightDest
    }
  ];

  // Generate Train Options
  const isAnakapalleToHyd = (originName.toLowerCase().includes('anakapalle') && destinationName.toLowerCase().includes('hyderabad'));
  
  const trainOptions = isAnakapalleToHyd ? [
    {
      mode: 'train',
      transitNumber: 'Godavari Express 12727',
      departureTime: '05:40 PM',
      arrivalTime: '06:15 AM',
      durationMinutes: 755,
      estimatedCost: Math.round(15 * rate), // ~1200 INR AC-3T
      originStation: 'Anakapalle (AKP)',
      destinationStation: 'Secunderabad Jn (SC)'
    },
    {
      mode: 'train',
      transitNumber: 'Janmabhoomi Express 12805',
      departureTime: '06:40 AM',
      arrivalTime: '07:45 PM',
      durationMinutes: 785,
      estimatedCost: Math.round(8 * rate), // ~640 INR CC
      originStation: 'Anakapalle (AKP)',
      destinationStation: 'Secunderabad Jn (SC)'
    },
    {
      mode: 'train',
      transitNumber: 'Visakha Express 17015',
      departureTime: '04:30 PM',
      arrivalTime: '07:30 AM',
      durationMinutes: 900,
      estimatedCost: Math.round(13 * rate), // ~1040 INR AC-3T
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
      originStation: trainOrigin,
      destinationStation: trainDest
    },
    {
      mode: 'train',
      transitNumber: 'Shatabdi Express TR-1201',
      departureTime: '02:00 PM',
      arrivalTime: '07:45 PM',
      durationMinutes: 345,
      estimatedCost: Math.round(45 * rate),
      originStation: trainOrigin,
      destinationStation: trainDest
    },
    {
      mode: 'train',
      transitNumber: 'Superfast Train TR-2022',
      departureTime: '09:30 PM',
      arrivalTime: '03:15 AM',
      durationMinutes: 345,
      estimatedCost: Math.round(65 * rate),
      originStation: trainOrigin,
      destinationStation: trainDest
    }
  ];

  // Generate Bus Options
  const busOptions = [
    {
      mode: 'bus',
      transitNumber: 'APSRTC Volvo Multi-Axle',
      departureTime: '08:00 PM',
      arrivalTime: '06:00 AM',
      durationMinutes: 600,
      estimatedCost: Math.round(12 * rate), // ~960 INR
      originStation: `${originName} Bus Stand`,
      destinationStation: `${destinationName} Bus Stand`
    },
    {
      mode: 'bus',
      transitNumber: 'Orange Travels AC Sleeper',
      departureTime: '09:30 PM',
      arrivalTime: '07:15 AM',
      durationMinutes: 585,
      estimatedCost: Math.round(18 * rate), // ~1440 INR
      originStation: `${originName} Bypass`,
      destinationStation: `${destinationName} Central Bus Stand`
    }
  ];

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
