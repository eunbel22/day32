import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { decide } from '../lib/decide';
import Weather from './Weather';
import WorkflowGraph from './WorkflowGraph';
import JudgmentLog from './JudgmentLog';
import StatusBoard from './StatusBoard';

interface Booking {
  id: number;
  customer: string;
  decision: string;
  reason: string;
  options?: string;
  candidate?: string;
  trace?: string;
  date: string;
  slots_wanted: string;
  kind: string;
  form: string;
  memo: string;
  status: string;
  slot_assigned?: string;
}

export default function DashboardTab() {
  const [autoJudge, setAutoJudge] = useState(() => {
    const saved = localStorage.getItem('auto-judge');
    return saved ? JSON.parse(saved) : true;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [judgeCount, setJudgeCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('auto-judge', JSON.stringify(autoJudge));
  }, [autoJudge]);

  useEffect(() => {
    fetchBookings();

    // Realtime 구독
    const channel = supabase
      .channel('bookings-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer, decision, reason, options, candidate, trace, date, slots_wanted, kind, form, memo, status, slot_assigned');

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
  };

  const handleJudgeAll = async () => {
    setLoading(true);
    const pendingBookings = bookings.filter((b) => b.decision === 'pending');

    for (const booking of pendingBookings) {
      const decideResult = decide(
        {
          customer: booking.customer,
          kind: booking.kind,
          date: booking.date,
          slots_wanted: booking.slots_wanted,
        },
        bookings,
        autoJudge
      );

      await supabase.from('bookings').update({
        decision: decideResult.decision,
        reason: decideResult.reason,
        options: decideResult.options || null,
        candidate: decideResult.candidate || null,
        slot_assigned: decideResult.slotAssigned || null,
        trace: decideResult.trace.join('\n'),
        status: decideResult.decision.startsWith('confirmed') ? 'confirmed' : 'pending',
      }).eq('id', booking.id);

      setJudgeCount((prev) => prev + 1);
    }

    await fetchBookings();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* 날씨 */}
      <Weather />

      {/* 제어 패널 */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all">
              <input
                type="checkbox"
                checked={autoJudge}
                onChange={(e) => setAutoJudge(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-white text-blue-600"
              />
              <span className="font-bold">자동 판정</span>
              <span className={`ml-1 px-3 py-1 rounded-full text-xs font-black ${
                autoJudge ? 'bg-emerald-400 text-emerald-900' : 'bg-gray-300 text-gray-700'
              }`}>
                {autoJudge ? '🟢 ON' : '⚪ OFF'}
              </span>
            </label>
          </div>

          <button
            onClick={handleJudgeAll}
            disabled={loading}
            className={`px-6 py-2.5 font-bold rounded-lg transition-all transform hover:scale-105 ${
              loading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-white text-purple-600 hover:bg-gray-100 shadow-lg'
            }`}
          >
            {loading ? `⚙️ 판정 중... (${judgeCount}건)` : '🚀 전부 판정'}
          </button>
        </div>
      </div>

      {/* 워크플로 그래프 */}
      <WorkflowGraph bookings={bookings} />

      {/* 판정 로그 + 상태 보드 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <JudgmentLog bookings={bookings} />
        </div>
        <div className="col-span-2">
          <StatusBoard bookings={bookings} />
        </div>
      </div>
    </div>
  );
}
