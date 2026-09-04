interface Booking {
  id: number;
  customer: string;
  decision: string;
  reason: string;
  options?: string;
  date: string;
  kind: string;
  form: string;
  memo: string;
  slot_assigned?: string;
  [key: string]: any;
}

interface StatusColumn {
  decision: string;
  label: string;
  icon: string;
  gradient: string;
  headerBg: string;
  border: string;
}

const STATUSES: StatusColumn[] = [
  { decision: 'pending', label: '대기', icon: '⏳', gradient: 'from-amber-50 to-orange-50', headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500', border: 'border-amber-200' },
  { decision: 'confirmed_auto', label: '확정-자동', icon: '✨', gradient: 'from-emerald-50 to-teal-50', headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-500', border: 'border-emerald-200' },
  { decision: 'confirmed_human', label: '확정-수동', icon: '✋', gradient: 'from-cyan-50 to-blue-50', headerBg: 'bg-gradient-to-r from-cyan-500 to-blue-500', border: 'border-cyan-200' },
  { decision: 'review', label: '검토', icon: '👁️', gradient: 'from-yellow-50 to-amber-50', headerBg: 'bg-gradient-to-r from-yellow-500 to-amber-500', border: 'border-yellow-200' },
  { decision: 'rejected', label: '기각', icon: '❌', gradient: 'from-red-50 to-rose-50', headerBg: 'bg-gradient-to-r from-red-500 to-rose-500', border: 'border-red-200' },
  { decision: 'asking', label: '질문', icon: '❓', gradient: 'from-indigo-50 to-purple-50', headerBg: 'bg-gradient-to-r from-indigo-500 to-purple-500', border: 'border-indigo-200' },
];

export default function StatusBoard({ bookings }: { bookings: Booking[] }) {
  const getBookingsByDecision = (decision: string): Booking[] => {
    return bookings.filter((b) => b.decision === decision);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          📋 상태 보드
        </h3>
        <p className="text-xs text-gray-600">각 상태별 예약 현황</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map((status) => {
          const items = getBookingsByDecision(status.decision);
          return (
            <div
              key={status.decision}
              className={`bg-gradient-to-br ${status.gradient} rounded-2xl border-2 ${status.border} shadow-lg overflow-hidden transition-all hover:shadow-xl`}
            >
              {/* 헤더 */}
              <div className={`${status.headerBg} text-white p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{status.icon}</span>
                  <h3 className="font-bold text-lg">{status.label}</h3>
                </div>
                <div className="inline-block px-3 py-1 bg-white bg-opacity-30 rounded-full text-xs font-bold">
                  {items.length}건
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {items.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    {/* 고객사 */}
                    <div className="font-bold text-gray-800 text-sm mb-1.5 truncate">{booking.customer}</div>

                    {/* 날짜 */}
                    <div className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                      <span>📅</span>
                      <span>{booking.date}</span>
                    </div>

                    {/* 종류·형태 배지 */}
                    <div className="flex gap-1.5 mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-200">
                        {booking.kind}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          booking.form === '외근'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        {booking.form}
                      </span>
                    </div>

                    {/* 메모 */}
                    {booking.memo && (
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        💬 {booking.memo}
                      </div>
                    )}

                    {/* 확정된 칸 */}
                    {booking.slot_assigned && (
                      <div className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded px-2 py-1 font-semibold border border-blue-200 mb-1">
                        🎯 {booking.slot_assigned}
                      </div>
                    )}

                    {/* 리뷰 옵션 */}
                    {booking.decision === 'review' && booking.options && (
                      <div className="text-xs text-gray-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200 font-semibold mb-1">
                        👥 선택: {booking.options.split(',').map(c => c.trim()).join(', ')}
                      </div>
                    )}

                    {/* Reason 메시지 */}
                    {!booking.slot_assigned && booking.reason && (
                      <div className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2 pt-1 mt-1">
                        "{booking.reason}"
                      </div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-12">
                    <div className="text-3xl mb-2">🌟</div>
                    예약이 없습니다
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
