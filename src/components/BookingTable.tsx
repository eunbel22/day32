import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string | null;
  status: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function BookingTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer, service, date, time, address, status');

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      fetchBookings();
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="p-4 text-center text-gray-600">예약이 없습니다</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="px-6 py-4 text-left font-bold">고객사</th>
              <th className="px-6 py-4 text-left font-bold">서비스</th>
              <th className="px-6 py-4 text-left font-bold">날짜</th>
              <th className="px-6 py-4 text-left font-bold">시간</th>
              <th className="px-6 py-4 text-left font-bold">상태</th>
              <th className="px-6 py-4 text-left font-bold">주소</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 font-semibold text-gray-800">{booking.customer}</td>
                <td className="px-6 py-4 text-gray-700">{booking.service}</td>
                <td className="px-6 py-4 text-gray-700">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    {booking.date}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  <span className="font-semibold">{booking.time}</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(booking.id, booking.status)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 ${
                      booking.status === 'pending'
                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {booking.status === 'pending' ? '⏳ 대기' : '✓ 확정'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {booking.address ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
                    >
                      📍 {booking.address}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
