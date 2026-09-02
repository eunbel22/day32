import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sendSlackMessage } from '../utils/slack';

interface BookingFormProps {
  onSuccess?: () => void;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [customer, setCustomer] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
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

  const handleMapClick = async (lat: number, lng: number) => {
    if (!map.current) return;

    // 마커 업데이트
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
    } else {
      marker.current = L.marker([lat, lng], { draggable: true })
        .addTo(map.current)
        .on('dragend', () => {
          if (marker.current) {
            const pos = marker.current.getLatLng();
            handleMapClick(pos.lat, pos.lng);
          }
        });
    }

    // 역지오코딩
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.address) {
          setAddress(data.display_name || data.address.city || `${lat}, ${lng}`);
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleAddressChange = async (value: string) => {
    setAddress(value);

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
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    });

    if (insertError) {
      setError(`예약 추가 실패: ${insertError.message}`);
      setLoading(false);
    } else {
      // Slack 알림 전송
      await sendSlackMessage('✅ 새 예약이 추가되었습니다', {
        고객사: customer,
        서비스: service,
        날짜: date,
        시간: time,
        주소: address || '(없음)',
      });

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
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">예약 추가</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객사 *</label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="고객사명"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">서비스 *</label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="서비스명"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">날짜 *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">시간 *</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">주소</label>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="주소 입력하거나 지도에서 클릭"
          />
          <p className="text-xs text-gray-500 mt-1">지도를 클릭하거나 마커를 드래그</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">지도 (클릭 또는 검색)</label>
          <div
            ref={mapContainer}
            className="w-full h-24 border border-gray-300 rounded bg-gray-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '추가 중...' : '예약하기'}
      </button>
    </form>
  );
}
