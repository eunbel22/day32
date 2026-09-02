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

interface EditingBooking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string | null;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function BookingTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState<EditingBooking | null>(null);
  const [editingData, setEditingData] = useState<EditingBooking | null>(null);

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

  const deleteBooking = async (id: number) => {
    if (!confirm('이 예약을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
    } else {
      fetchBookings();
    }
  };

  const startEditing = (booking: Booking) => {
    setEditingBooking(booking);
    setEditingData({
      id: booking.id,
      customer: booking.customer,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      address: booking.address,
    });
  };

  const saveEditing = async () => {
    if (!editingData) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        customer: editingData.customer,
        service: editingData.service,
        date: editingData.date,
        time: editingData.time,
        address: editingData.address,
      })
      .eq('id', editingData.id);

    if (error) {
      console.error('Error updating booking:', error);
    } else {
      setEditingBooking(null);
      setEditingData(null);
      fetchBookings();
    }
  };

  const cancelEditing = () => {
    setEditingBooking(null);
    setEditingData(null);
  };

  const filteredBookings = bookings.filter((booking) =>
    booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-4 text-center text-gray-600">로딩 중...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="고객사, 서비스, 주소로 검색..."
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
        />
      </div>

      {filteredBookings.length === 0 && bookings.length > 0 && (
        <div className="p-4 text-center text-gray-600">검색 결과가 없습니다</div>
      )}

      {bookings.length === 0 && (
        <div className="p-4 text-center text-gray-600">예약이 없습니다</div>
      )}

      {filteredBookings.length > 0 && (
        <div className="text-xs text-gray-500 mb-3">검색 결과: {filteredBookings.length}건</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="px-6 py-4 text-left font-bold w-32">고객사</th>
              <th className="px-6 py-4 text-left font-bold w-24">서비스</th>
              <th className="px-6 py-4 text-left font-bold w-28">날짜</th>
              <th className="px-6 py-4 text-left font-bold w-20">시간</th>
              <th className="px-6 py-4 text-left font-bold w-24">상태</th>
              <th className="px-6 py-4 text-left font-bold flex-1">주소</th>
              <th className="px-6 py-4 text-center font-bold w-24">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 font-semibold text-gray-800 text-sm whitespace-nowrap truncate">{booking.customer}</td>
                <td className="px-6 py-4 text-gray-700 text-sm">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold whitespace-nowrap text-xs">
                    {booking.service}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 text-sm">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    {booking.date}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 text-sm">
                  <span className="font-semibold">{booking.time}</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(booking.id, booking.status)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap ${
                      booking.status === 'pending'
                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {booking.status === 'pending' ? '⏳ 대기' : '✓ 확정'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  {booking.address ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200 truncate block"
                    >
                      📍 {booking.address}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => startEditing(booking)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => deleteBooking(booking.id)}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingBooking && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-blue-600 mb-4">예약 수정</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">고객사</label>
                <input
                  type="text"
                  value={editingData.customer}
                  onChange={(e) =>
                    setEditingData({ ...editingData, customer: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">서비스</label>
                <input
                  type="text"
                  value={editingData.service}
                  onChange={(e) =>
                    setEditingData({ ...editingData, service: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">날짜</label>
                  <input
                    type="date"
                    value={editingData.date}
                    onChange={(e) =>
                      setEditingData({ ...editingData, date: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">시간</label>
                  <input
                    type="time"
                    value={editingData.time}
                    onChange={(e) =>
                      setEditingData({ ...editingData, time: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={editingData.address || ''}
                  onChange={(e) =>
                    setEditingData({ ...editingData, address: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEditing}
                className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 저장
              </button>
              <button
                onClick={cancelEditing}
                className="flex-1 bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
