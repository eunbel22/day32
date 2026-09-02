import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
    if (!mapContainer.current) return;

    try {
      map.current = L.map(mapContainer.current, { attributionControl: false }).setView(
        [37.5665, 126.978],
        10
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map.current);
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
    if (!map.current) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    bookings.forEach((booking) => {
      if (booking.lat && booking.lng && map.current) {
        const marker = L.marker([booking.lat, booking.lng])
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
      }
    });

    if (bookings.length > 0) {
      const group = new L.featureGroup(markers.current);
      map.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*');

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      const bookingsWithCoords = await Promise.all(
        (data || []).map(async (b) => {
          if (!b.address) return b;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                b.address
              )}&format=json&limit=1`,
              { signal: AbortSignal.timeout(5000) }
            );

            if (!response.ok) return b;

            const result = await response.json();
            if (result && result.length > 0) {
              return {
                ...b,
                lat: parseFloat(result[0].lat),
                lng: parseFloat(result[0].lon),
              };
            }
          } catch (err) {
            console.error('Geocoding error:', err);
          }

          return b;
        })
      );

      setBookings(bookingsWithCoords);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">지도 로딩 중...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          예약 위치 지도
        </h2>
        <p className="text-gray-600 text-sm">
          지도의 마커를 클릭하면 예약 정보를 확인할 수 있습니다. ({bookings.filter(b => b.lat && b.lng).length}/{bookings.length}건 표시)
        </p>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-96 border-2 border-gray-200 rounded-lg bg-gray-100 shadow-md"
      />
    </div>
  );
}
