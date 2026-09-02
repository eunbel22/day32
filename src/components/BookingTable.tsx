import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sendSlackMessage } from '../utils/slack';

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
      // Slack 알림 전송
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        await sendSlackMessage(`🔄 예약 상태가 변경되었습니다`, {
          고객사: booking.customer,
          서비스: booking.service,
          이전상태: currentStatus === 'pending' ? '대기' : '확정',
          새로운상태: newStatus === 'pending' ? '대기' : '확정',
        });
      }

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
    <div className="p-4">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">고객사</th>
            <th className="border border-gray-300 p-2 text-left">서비스</th>
            <th className="border border-gray-300 p-2 text-left">날짜</th>
            <th className="border border-gray-300 p-2 text-left">시간</th>
            <th className="border border-gray-300 p-2 text-left">상태</th>
            <th className="border border-gray-300 p-2 text-left">주소</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{booking.customer}</td>
              <td className="border border-gray-300 p-2">{booking.service}</td>
              <td className="border border-gray-300 p-2">{booking.date}</td>
              <td className="border border-gray-300 p-2">{booking.time}</td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => toggleStatus(booking.id, booking.status)}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {booking.status === 'pending' ? '대기' : '확정'}
                </button>
              </td>
              <td className="border border-gray-300 p-2">
                {booking.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {booking.address}
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
