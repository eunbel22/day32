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
    <div className="flex gap-4 mb-8">
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-blue-600">{todayCount}</div>
        <div className="text-sm text-gray-600 mt-2">오늘 예약</div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-green-600">{confirmationRate}%</div>
        <div className="text-sm text-gray-600 mt-2">확정률</div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <div className="text-3xl font-bold text-purple-600">{weekCount}</div>
        <div className="text-sm text-gray-600 mt-2">이번 주 총 건수</div>
      </div>
    </div>
  );
}
