import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface BookingFormProps {
  onSuccess?: () => void;
}

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [customer, setCustomer] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Leaflet 마커 아이콘 설정
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // 지도 초기화 (서울 중심)
      map.current = L.map(mapContainer.current, { attributionControl: false }).setView(
        [37.5665, 126.978],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map.current);

      // 지도 클릭 시 위치 선택
      map.current.on('click', (e) => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      });
    } catch (err) {
      console.error('Map initialization error:', err);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!lat || !lng) return;

    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

        if (!apiKey) {
          setWeatherLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ko`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 10) / 10,
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  const handleMapClick = async (latitude: number, longitude: number) => {
    if (!map.current) return;

    setLat(latitude);
    setLng(longitude);

    if (marker.current) {
      marker.current.setLatLng([latitude, longitude]);
    } else {
      marker.current = L.marker([latitude, longitude], { draggable: true })
        .addTo(map.current)
        .on('dragend', () => {
          if (marker.current) {
            const pos = marker.current.getLatLng();
            handleMapClick(pos.lat, pos.lng);
          }
        });
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.display_name) {
          setAddress(data.display_name);
          setAddressError('');
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleAddressChange = async (value: string) => {
    setAddress(value);
    setAddressError('');

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value.trim()) return;

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);

          if (map.current) {
            map.current.setView([latNum, lonNum], 15);
            handleMapClick(latNum, lonNum);
          }
          setAddressError(''); // 유효한 주소
        } else {
          setAddressError('유효하지 않은 주소입니다. 다시 확인해주세요.');
        }
      } catch (err) {
        console.error('Search error:', err);
        setAddressError('주소 검색 중 오류가 발생했습니다.');
      }
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!customer || !service || !date || !time) {
      setError('필수 칸을 모두 입력하세요');
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from('bookings').insert({
      customer,
      service,
      date,
      time,
      address: address || null,
      lat: lat || null,
      lng: lng || null,
    });

    if (insertError) {
      setError(`예약 추가 실패: ${insertError.message}`);
      setLoading(false);
    } else {
      setCustomer('');
      setService('');
      setDate('');
      setTime('');
      setAddress('');
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        예약 추가
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-bold text-blue-600 mb-2">고객사 *</label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="고객사명"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-blue-600 mb-2">서비스 *</label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="서비스명"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-blue-600 mb-2">날짜 *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-blue-600 mb-2">시간 *</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-bold text-blue-600 mb-2">주소</label>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className={`w-full border-2 rounded-lg p-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
              addressError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder="주소 입력하거나 지도에서 클릭"
          />
          {addressError ? (
            <p className="text-xs text-red-600 mt-2 font-medium">⚠️ {addressError}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-2">지도를 클릭하거나 마커를 드래그</p>
          )}
          {lat && lng && (
            <p className="text-xs text-blue-600 mt-2 font-semibold bg-blue-50 p-2 rounded">
              📍 위도: {lat.toFixed(4)}, 경도: {lng.toFixed(4)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-blue-600 mb-2">지도 (클릭 또는 검색)</label>
          <div
            ref={mapContainer}
            className="w-full h-96 border-2 border-gray-200 rounded-lg bg-gray-100 shadow-md mb-4"
          />

          {weather && (
            <div className="p-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg text-white shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {weather.description === 'Clear'
                      ? '☀️'
                      : weather.description === 'Clouds'
                        ? '☁️'
                        : weather.description === 'Rain'
                          ? '🌧️'
                          : weather.description === 'Thunderstorm'
                            ? '⛈️'
                            : weather.description === 'Snow'
                              ? '❄️'
                              : '🌤️'}
                  </span>
                  <div>
                    <p className="text-2xl font-bold">{weather.temp}°C</p>
                    <p className="text-sm text-orange-100">{weather.description}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm">💧 {weather.humidity}%</p>
                  <p className="text-sm">💨 {weather.windSpeed} m/s</p>
                </div>
              </div>
            </div>
          )}

          {weatherLoading && (
            <div className="p-4 bg-gray-100 rounded-lg text-gray-600 text-sm">
              날씨 정보 로딩 중...
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? '추가 중...' : '✓ 예약하기'}
      </button>
    </form>
  );
}
