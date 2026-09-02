import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Booking {
  id: number;
  date: string;
  status: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function StatCards({ refreshKey }: { refreshKey?: number }) {
  const [todayCount, setTodayCount] = useState(0);
  const [confirmationRate, setConfirmationRate] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, date, status');

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    const bookings: Booking[] = data || [];

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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
  );
}
