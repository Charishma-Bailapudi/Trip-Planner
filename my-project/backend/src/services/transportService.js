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

const getAllTransportOptions = (originName, destinationName, preferences, budgetMode, currency) => {
  const options = [];
  const rate = currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'GBP' ? 0.8 : 1;

  const activePrefs = (preferences && preferences.length > 0) ? preferences : ['flight', 'train', 'bus'];

  activePrefs.forEach(pref => {
    const mode = pref.toLowerCase();
    if (mode === 'flight') {
      options.push(
        {
          mode: 'flight',
          transitNumber: `Flight FL-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '07:30 AM',
          arrivalTime: '09:45 AM',
          durationMinutes: 135,
          estimatedCost: Math.round(150 * rate),
          originStation: `${originName} Airport (T3)`,
          destinationStation: `${destinationName} Airport (T1)`
        },
        {
          mode: 'flight',
          transitNumber: `Flight FL-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '02:15 PM',
          arrivalTime: '04:30 PM',
          durationMinutes: 135,
          estimatedCost: Math.round(180 * rate),
          originStation: `${originName} Airport (T3)`,
          destinationStation: `${destinationName} Airport (T1)`
        },
        {
          mode: 'flight',
          transitNumber: `Flight FL-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '08:00 PM',
          arrivalTime: '10:15 PM',
          durationMinutes: 135,
          estimatedCost: Math.round(120 * rate),
          originStation: `${originName} Airport (T3)`,
          destinationStation: `${destinationName} Airport (T1)`
        }
      );
    } else if (mode === 'train') {
      options.push(
        {
          mode: 'train',
          transitNumber: `Train TR-${2000 + Math.floor(Math.random() * 8000)}`,
          departureTime: '06:00 AM',
          arrivalTime: '11:30 AM',
          durationMinutes: 330,
          estimatedCost: Math.round(40 * rate),
          originStation: `${originName} Central Station`,
          destinationStation: `${destinationName} Main Station`
        },
        {
          mode: 'train',
          transitNumber: `Train TR-${2000 + Math.floor(Math.random() * 8000)}`,
          departureTime: '12:00 PM',
          arrivalTime: '05:45 PM',
          durationMinutes: 345,
          estimatedCost: Math.round(55 * rate),
          originStation: `${originName} Central Station`,
          destinationStation: `${destinationName} Junction`
        },
        {
          mode: 'train',
          transitNumber: `Train TR-${2000 + Math.floor(Math.random() * 8000)}`,
          departureTime: '04:30 PM',
          arrivalTime: '10:00 PM',
          durationMinutes: 330,
          estimatedCost: Math.round(85 * rate),
          originStation: `${originName} Central Station`,
          destinationStation: `${destinationName} Main Station`
        }
      );
    } else if (mode === 'bus') {
      options.push(
        {
          mode: 'bus',
          transitNumber: `Bus Volvo BS-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '08:00 AM',
          arrivalTime: '02:30 PM',
          durationMinutes: 390,
          estimatedCost: Math.round(15 * rate),
          originStation: `${originName} Bus Terminus`,
          destinationStation: `${destinationName} Bus Junction`
        },
        {
          mode: 'bus',
          transitNumber: `Bus Sleeper BS-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '01:00 PM',
          arrivalTime: '07:45 PM',
          durationMinutes: 405,
          estimatedCost: Math.round(20 * rate),
          originStation: `${originName} Bus Stand`,
          destinationStation: `${destinationName} Bus Stand`
        },
        {
          mode: 'bus',
          transitNumber: `Bus Luxury BS-${100 + Math.floor(Math.random() * 900)}`,
          departureTime: '09:00 PM',
          arrivalTime: '03:30 AM',
          durationMinutes: 390,
          estimatedCost: Math.round(30 * rate),
          originStation: `${originName} Bus Terminus`,
          destinationStation: `${destinationName} Bus Junction`
        }
      );
    }
  });

  // Scale estimates based on budget mode
  if (budgetMode === 'tier') {
    options.forEach(opt => {
      opt.estimatedCost = Math.round(opt.estimatedCost * 0.9);
    });
  }

  return options;
};

module.exports = {
  getTransportOptions,
  getAllTransportOptions
};
