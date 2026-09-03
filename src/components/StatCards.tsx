import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface BookingData {
  id: number;
  date: string;
  status: string;
  time?: string;
  customer?: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TimeSlotStats {
  '09': number;
  '12': number;
  '15': number;
  '18': number;
}

export default function StatCards({ refreshKey }: { refreshKey?: number }) {
  const [todayCount, setTodayCount] = useState(0);
  const [confirmationRate, setConfirmationRate] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [timeSlotStats, setTimeSlotStats] = useState<TimeSlotStats>({
    '09': 0,
    '12': 0,
    '15': 0,
    '18': 0,
  });
  const [topCustomer, setTopCustomer] = useState<{ name: string; count: number } | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, date, status, time, customer');

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    const bookings: BookingData[] = data || [];

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter((b) => b.date === today);
    setTodayCount(todayBookings.length);

    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const rate = bookings.length > 0 ? (confirmedCount / bookings.length) * 100 : 0;
    setConfirmationRate(Math.round(rate * 10) / 10);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const mondayStr = monday.toISOString().split('T')[0];
    const fridayStr = friday.toISOString().split('T')[0];

    const weekBookings = bookings.filter(
      (b) => b.date >= mondayStr && b.date <= fridayStr
    );
    setWeekCount(weekBookings.length);

    // 시간대별 통계
    const slots: TimeSlotStats = { '09': 0, '12': 0, '15': 0, '18': 0 };
    bookings.forEach((b) => {
      const hour = b.time?.substring(0, 2);
      if (hour && slots.hasOwnProperty(hour)) {
        slots[hour as keyof TimeSlotStats]++;
      }
    });
    setTimeSlotStats(slots);

    // 고객사별 통계 (상위 1개)
    const customerCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.customer) {
        customerCounts[b.customer] = (customerCounts[b.customer] || 0) + 1;
      }
    });
    const topCust = Object.entries(customerCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCust) {
      setTopCustomer({ name: topCust[0], count: topCust[1] });
    }
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-black">{todayCount}</div>
            <div className="text-blue-100 mt-3 text-sm font-medium">오늘 예약</div>
          </div>
          <div className="text-6xl opacity-20">📅</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-black">{confirmationRate}%</div>
            <div className="text-emerald-100 mt-3 text-sm font-medium">확정률</div>
          </div>
          <div className="text-6xl opacity-20">✓</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-black">{weekCount}</div>
            <div className="text-purple-100 mt-3 text-sm font-medium">이번 주 총 건수</div>
          </div>
          <div className="text-6xl opacity-20">📊</div>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xs font-semibold text-indigo-100 uppercase tracking-widest mb-4">시간대별 예약</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">09:00</span>
              <div className="flex-1 mx-3 bg-indigo-400 h-2 rounded" style={{ width: `${Math.min((timeSlotStats['09'] / Math.max(timeSlotStats['09'], timeSlotStats['12'], timeSlotStats['15'], timeSlotStats['18']) || 1) * 100, 100)}%` }}></div>
              <span className="text-lg font-bold">{timeSlotStats['09']}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">12:00</span>
              <div className="flex-1 mx-3 bg-indigo-400 h-2 rounded" style={{ width: `${Math.min((timeSlotStats['12'] / Math.max(timeSlotStats['09'], timeSlotStats['12'], timeSlotStats['15'], timeSlotStats['18']) || 1) * 100, 100)}%` }}></div>
              <span className="text-lg font-bold">{timeSlotStats['12']}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">15:00</span>
              <div className="flex-1 mx-3 bg-indigo-400 h-2 rounded" style={{ width: `${Math.min((timeSlotStats['15'] / Math.max(timeSlotStats['09'], timeSlotStats['12'], timeSlotStats['15'], timeSlotStats['18']) || 1) * 100, 100)}%` }}></div>
              <span className="text-lg font-bold">{timeSlotStats['15']}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">18:00</span>
              <div className="flex-1 mx-3 bg-indigo-400 h-2 rounded" style={{ width: `${Math.min((timeSlotStats['18'] / Math.max(timeSlotStats['09'], timeSlotStats['12'], timeSlotStats['15'], timeSlotStats['18']) || 1) * 100, 100)}%` }}></div>
              <span className="text-lg font-bold">{timeSlotStats['18']}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <h3 className="text-xs font-semibold text-pink-100 uppercase tracking-widest mb-4">주요 고객사</h3>
          {topCustomer ? (
            <div>
              <p className="text-4xl font-black mb-2">{topCustomer.name}</p>
              <p className="text-pink-100">총 {topCustomer.count}건의 예약</p>
              <p className="text-xs text-pink-200 mt-3">가장 많은 예약을 한 고객사입니다</p>
            </div>
          ) : (
            <p className="text-pink-100">예약이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
