import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

      if (!apiKey) {
        setError('날씨 API 키가 없습니다');
        setLoading(false);
        return;
      }

      // 서울 기준 (기본값)
      const lat = 37.5665;
      const lon = 126.978;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ko`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        throw new Error('날씨 데이터를 가져올 수 없습니다');
      }

      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        icon: data.weather[0].icon,
      });
      setError('');
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('날씨 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherEmoji = (description: string) => {
    switch (description) {
      case 'Clear':
        return '☀️';
      case 'Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Thunderstorm':
        return '⛈️';
      case 'Snow':
        return '❄️';
      case 'Mist':
      case 'Smoke':
      case 'Haze':
      case 'Dust':
      case 'Fog':
      case 'Sand':
      case 'Ash':
      case 'Squall':
      case 'Tornado':
        return '🌫️';
      default:
        return '🌤️';
    }
  };

  if (loading) {
    return (
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-gray-600 text-sm">날씨 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">서울 날씨</h3>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getWeatherEmoji(weather.description)}</span>
            <div>
              <p className="text-2xl font-bold text-blue-600">{weather.temp}°C</p>
              <p className="text-sm text-gray-600">{weather.description}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            💧 습도: <span className="font-semibold">{weather.humidity}%</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            💨 바람: <span className="font-semibold">{weather.windSpeed} m/s</span>
          </p>
        </div>
      </div>
    </div>
  );
}
