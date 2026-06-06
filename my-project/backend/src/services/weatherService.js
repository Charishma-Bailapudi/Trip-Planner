const axios = require('axios');

const getWeatherData = async (latitude, longitude) => {
  const apiKey = process.env.WEATHER_API_KEY;

  // Graceful fallback for mock weather if API key is not configured
  if (!apiKey || apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.warn('[Weather Service] WEATHER_API_KEY is not set. Using fallback weather mock.');
    return getMockWeather(latitude, longitude);
  }

  try {
    // OpenWeatherMap 5-day / 3-hour forecast endpoint
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    
    const { list, city } = response.data;
    
    // Group and extract daily forecasts
    const dailyForecasts = [];
    const seenDates = new Set();

    for (const item of list) {
      const dateStr = item.dt_txt.split(' ')[0]; // YYYY-MM-DD
      if (!seenDates.has(dateStr) && dailyForecasts.length < 5) {
        seenDates.add(dateStr);
        dailyForecasts.push({
          date: dateStr,
          tempCelsius: Math.round(item.main.temp),
          condition: item.weather[0].main,
          description: item.weather[0].description,
          iconCode: item.weather[0].icon
        });
      }
    }

    return {
      cityName: city.name,
      country: city.country,
      forecast: dailyForecasts
    };
  } catch (error) {
    console.error('[Weather Service] Failed to retrieve weather from OpenWeatherMap API:', error.message);
    console.warn('[Weather Service] Falling back to Mock weather data.');
    return getMockWeather(latitude, longitude);
  }
};

// Generates high-quality mock weather data matching coordinates
function getMockWeather(lat, lng) {
  // Simple coordinate-based climate estimation
  let baseTemp = 20;
  let condition = 'Clear';
  let description = 'clear sky';
  let iconCode = '01d';

  if (Math.abs(lat) > 50) {
    // Cold climate
    baseTemp = 10;
    condition = 'Clouds';
    description = 'scattered clouds';
    iconCode = '03d';
  } else if (Math.abs(lat) < 20) {
    // Tropical climate
    baseTemp = 28;
    condition = 'Rain';
    description = 'moderate rain';
    iconCode = '10d';
  }

  const forecast = [];
  const start = new Date();

  for (let i = 0; i < 5; i++) {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];

    // Add slight variance to daily temp
    const dailyTemp = Math.round(baseTemp + (Math.random() - 0.5) * 4);

    forecast.push({
      date: dateStr,
      tempCelsius: dailyTemp,
      condition,
      description,
      iconCode
    });
  }

  return {
    cityName: 'Local Area',
    country: 'Destination',
    forecast
  };
}

module.exports = {
  getWeatherData
};
