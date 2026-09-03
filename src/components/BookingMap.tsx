import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string | null;
  status: string;
  lat?: number;
  lng?: number;
}

export default function BookingMap() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const initMap = () => {
      if (!mapContainer.current) {
        console.warn('Map container not found');
        return;
      }

      try {
        // Leaflet 마커 아이콘 설정
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // 기존 맵이 있으면 정리
        if (map.current) {
          try {
            map.current.remove();
          } catch (e) {
            console.warn('Error removing old map:', e);
          }
          map.current = null;
        }

        // 새 맵 생성
        map.current = L.map(mapContainer.current, {
          attributionControl: false,
          zoomControl: true
        }).setView([37.5665, 126.978], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map.current);

        console.log('Map initialized successfully');
      } catch (err) {
        console.error('Map initialization error:', err);
        map.current = null;
      }
    };

    if (!loading) {
      setTimeout(initMap, 150);
    }

    return () => {
      // cleanup 없음 - 다시 방문할 때 새로 초기화
    };
  }, [loading]);

  useEffect(() => {
    if (!map.current) return;

    try {
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      bookings.forEach((booking) => {
        if (booking.lat && booking.lng && map.current) {
          try {
            const customIcon = L.divIcon({
              html: `<div style="background-color: #ef4444; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">📍</div>`,
              iconSize: [40, 40],
              className: 'custom-marker',
            });

            const marker = L.marker([booking.lat, booking.lng], { icon: customIcon })
              .addTo(map.current)
              .bindPopup(
                `<div class="p-2">
                  <p class="font-bold text-sm">${booking.customer}</p>
                  <p class="text-xs">${booking.service}</p>
                  <p class="text-xs text-gray-600">${booking.date} ${booking.time}</p>
                  <p class="text-xs mt-1 ${
                    booking.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                  }">${booking.status === 'pending' ? '⏳ 대기' : '✓ 확정'}</p>
                </div>`
              );
            markers.current.push(marker);
            console.log('Marker added:', booking.customer, booking.lat, booking.lng);
          } catch (err) {
            console.error('Marker creation error:', err);
          }
        }
      });

      if (markers.current.length > 0) {
        try {
          const group = L.featureGroup(markers.current);
          map.current.fitBounds(group.getBounds().pad(0.1));
        } catch (err) {
          console.error('FitBounds error:', err);
        }
      }
    } catch (err) {
      console.error('Marker update error:', err);
    }
  }, [bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*');

    if (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
      return;
    }

    console.log('Bookings loaded from DB:', data);

    const bookingsWithCoords = (data || []).map((b) => {
      if (b.lat && b.lng) {
        console.log('Using saved coordinates:', b.customer, b.lat, b.lng);
        return b;
      }
      return b;
    });

    console.log('Final bookings with coords:', bookingsWithCoords);
    setBookings(bookingsWithCoords);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          예약 위치 지도
        </h2>
        <p className="text-gray-600 text-sm">
          {loading
            ? '주소를 지도 위치로 변환 중입니다...'
            : `지도의 마커를 클릭하면 예약 정보를 확인할 수 있습니다. (${bookings.filter((b) => b.lat && b.lng).length}/${bookings.length}건 표시)`}
        </p>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-96 border-2 border-gray-200 rounded-lg bg-gray-100 shadow-md relative"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-md">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-gray-600 font-medium">지도를 로드하는 중입니다...</p>
              <p className="text-xs text-gray-500 mt-2">주소를 위도/경도로 변환하고 있습니다</p>
            </div>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-gray-600">예약이 없습니다</p>
          </div>
        )}

        {!loading && bookings.length > 0 && bookings.filter((b) => b.lat && b.lng).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-gray-600">주소 정보가 없어 지도에 표시할 예약이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
