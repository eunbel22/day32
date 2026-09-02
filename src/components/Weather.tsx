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
    <div className="mb-8 p-6 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500 rounded-xl shadow-lg text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
      <div className="relative z-10">
        <h3 className="text-xs font-semibold text-blue-100 uppercase tracking-widest mb-4">서울 현재 날씨</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-7xl">{getWeatherEmoji(weather.description)}</span>
            <div>
              <p className="text-6xl font-black">{weather.temp}°C</p>
              <p className="text-lg text-blue-100 mt-1 font-medium">{weather.description}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <p className="text-lg">
              💧 <span className="font-semibold">{weather.humidity}%</span>
            </p>
            <p className="text-lg">
              💨 <span className="font-semibold">{weather.windSpeed} m/s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
