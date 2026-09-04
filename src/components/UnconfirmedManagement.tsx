import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
}

export default function UnconfirmedManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer, decision, reason, options, candidate, trace, date, slots_wanted, kind');

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const toggleTrace = (id: number) => {
    const newExpanded = new Set(expandedTrace);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTrace(newExpanded);
  };

  const handleConfirm = async (id: number, candidate: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        decision: 'confirmed_human',
        slot_assigned: candidate,
        status: 'confirmed',
      })
      .eq('id', id);

    if (error) {
      console.error('Error confirming booking:', error);
    } else {
      fetchBookings();
    }
  };

  const handleReviewDecision = async (id: number, chosenCustomer: string, allCustomers: string) => {
    const [cust1, cust2] = allCustomers.split(',').map((s) => s.trim());
    const otherCustomer = chosenCustomer === cust1 ? cust2 : cust1;
    const bookingDate = bookings.find((b) => b.id === id)?.date;

    if (!bookingDate) return;

    // 현재 예약을 confirmed_human으로
    await supabase
      .from('bookings')
      .update({ decision: 'confirmed_human', status: 'confirmed' })
      .eq('customer', chosenCustomer)
      .eq('date', bookingDate);

    // 다른 고객사의 예약을 pending으로 (다시 판정 대상)
    await supabase
      .from('bookings')
      .update({ decision: 'pending', status: 'pending' })
      .eq('customer', otherCustomer)
      .eq('date', bookingDate);

    fetchBookings();
  };

  const getBadgeColor = (decision: string): string => {
    switch (decision) {
      case 'pending':
        return 'bg-gray-200 text-gray-800';
      case 'confirmed_auto':
        return 'bg-emerald-500 text-white';
      case 'confirmed_human':
        return 'border-2 border-emerald-500 bg-white text-emerald-600';
      case 'review':
        return 'bg-yellow-400 text-yellow-900';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'asking':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getDecisionLabel = (decision: string): string => {
    switch (decision) {
      case 'pending':
        return '대기';
      case 'confirmed_auto':
        return '확정 (자동)';
      case 'confirmed_human':
        return '확정 (수동)';
      case 'review':
        return '검토필요';
      case 'rejected':
        return '거부';
      case 'asking':
        return '정보필요';
      default:
        return decision;
    }
  };

  // decision이 pending/review/rejected/asking인 것만 필터
  const unconfirmedBookings = bookings.filter(
    (b) =>
      b.decision === 'pending' ||
      b.decision === 'review' ||
      b.decision === 'rejected' ||
      b.decision === 'asking'
  );

  if (loading) {
    return <div className="p-4 text-center text-gray-600">로딩 중...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg overflow-hidden">
      <h2 className="text-xl font-bold mb-4 text-blue-600">미확정 관리</h2>

      {unconfirmedBookings.length === 0 && (
        <div className="p-4 text-center text-gray-600">확인할 예약이 없습니다</div>
      )}

      {unconfirmedBookings.length > 0 && (
        <div className="space-y-4">
          {unconfirmedBookings.map((booking) => (
            <div
              key={booking.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              {/* 헤더: 고객사, 배지, reason */}
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{booking.customer}</div>
                  <div className="text-sm text-gray-600 mt-1">{booking.reason}</div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${getBadgeColor(
                    booking.decision
                  )}`}
                >
                  {getDecisionLabel(booking.decision)}
                </div>
              </div>

              {/* 정보 행: 날짜, 종류, 희망 슬롯 */}
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mb-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="font-semibold">날짜:</span> {booking.date}
                </div>
                <div>
                  <span className="font-semibold">종류:</span> {booking.kind}
                </div>
                <div>
                  <span className="font-semibold">희망슬롯:</span> {booking.slots_wanted}
                </div>
              </div>

              {/* 과정 보기 (접이식) */}
              {booking.trace && (
                <div className="mb-3">
                  <button
                    onClick={() => toggleTrace(booking.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {expandedTrace.has(booking.id) ? '▼' : '▶'} 과정 보기
                  </button>
                  {expandedTrace.has(booking.id) && (
                    <div className="mt-2 pl-4 border-l-2 border-blue-300 bg-blue-50 p-2 rounded text-xs text-gray-700 space-y-1">
                      {booking.trace.split('\n').map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="flex gap-2 flex-wrap">
                {/* pending: 후보가 있으면 "확정" 버튼 */}
                {booking.decision === 'pending' && booking.candidate && (
                  <button
                    onClick={() => handleConfirm(booking.id, booking.candidate!)}
                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    ✓ 확정 ({booking.candidate})
                  </button>
                )}

                {/* review: 두 고객사 옆에 버튼 */}
                {booking.decision === 'review' && booking.options && (
                  <>
                    {booking.options.split(',').map((customer) => (
                      <button
                        key={customer}
                        onClick={() => handleReviewDecision(booking.id, customer.trim(), booking.options!)}
                        className="px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                      >
                        이 쪽으로 확정: {customer.trim()}
                      </button>
                    ))}
                  </>
                )}

                {/* asking: 버튼 없음 (또는 편집 옵션) */}
                {booking.decision === 'asking' && (
                  <div className="text-xs text-blue-600 font-semibold">
                    ⓘ 정보를 입력한 후 다시 판정해주세요
                  </div>
                )}

                {/* rejected: 버튼 없음 */}
                {booking.decision === 'rejected' && (
                  <div className="text-xs text-red-600 font-semibold">
                    ⓘ 다른 날짜나 슬롯을 선택해주세요
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
