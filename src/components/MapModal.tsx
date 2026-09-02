import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
  address: string;
  onClose: () => void;
}

export default function MapModal({ address, onClose }: MapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapContainer.current || !address) return;

    const initializeMap = async () => {
      setLoading(true);
      setError('');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error('API 응답 실패');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          throw new Error('주소를 찾을 수 없습니다');
        }

        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (!mapContainer.current) return;

        if (map.current) {
          map.current.remove();
        }

        map.current = L.map(mapContainer.current).setView([latNum, lonNum], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current);

        L.marker([latNum, lonNum])
          .addTo(map.current)
          .bindPopup(`<b>${address}</b>`)
          .openPopup();

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching map data:', err);
        // 실패 시 Google Maps로 자동 오픈
        const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
        window.open(googleMapsUrl, '_blank');
        onClose();
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [address]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold truncate">{address}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl flex-shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="h-80 flex flex-col items-center justify-center bg-gray-100 gap-2">
            <p className="text-gray-600">지도 로딩 중...</p>
            <p className="text-xs text-gray-500">(Nominatim API에서 주소 검색 중)</p>
          </div>
        )}

        {error && (
          <div className="h-80 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">{error}</p>
              <p className="text-xs text-gray-500">다른 주소를 시도해주세요</p>
            </div>
          </div>
        )}

        {!loading && !error && <div ref={mapContainer} className="h-80 w-full" />}
      </div>
    </div>
  );
}
