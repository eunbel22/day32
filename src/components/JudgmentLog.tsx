import { useState, useEffect } from 'react';

interface Booking {
  id: number;
  customer: string;
  decision: string;
  reason: string;
  trace?: string;
  [key: string]: any;
}

export default function JudgmentLog({ bookings }: { bookings: Booking[] }) {
  const [logs, setLogs] = useState<Booking[]>([]);

  useEffect(() => {
    const judged = bookings
      .filter((b) => b.decision !== 'pending' && b.decision !== 'intake')
      .sort((a, b) => b.id - a.id)
      .slice(0, 12);

    setLogs(judged);
  }, [bookings]);

  const getDecisionIcon = (decision: string): string => {
    switch (decision) {
      case 'confirmed_auto':
        return '✨';
      case 'confirmed_human':
        return '✋';
      case 'review':
        return '👁️';
      case 'rejected':
        return '❌';
      case 'asking':
        return '❓';
      default:
        return '📍';
    }
  };

  const getDecisionStyle = (decision: string): { bg: string; border: string; text: string } => {
    switch (decision) {
      case 'confirmed_auto':
        return { bg: 'bg-gradient-to-r from-emerald-50 to-teal-50', border: 'border-emerald-300', text: 'text-emerald-700' };
      case 'confirmed_human':
        return { bg: 'bg-gradient-to-r from-cyan-50 to-blue-50', border: 'border-cyan-300', text: 'text-cyan-700' };
      case 'review':
        return { bg: 'bg-gradient-to-r from-yellow-50 to-amber-50', border: 'border-yellow-300', text: 'text-yellow-700' };
      case 'rejected':
        return { bg: 'bg-gradient-to-r from-red-50 to-pink-50', border: 'border-red-300', text: 'text-red-700' };
      case 'asking':
        return { bg: 'bg-gradient-to-r from-indigo-50 to-purple-50', border: 'border-indigo-300', text: 'text-indigo-700' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' };
    }
  };

  const getDecisionLabel = (decision: string): string => {
    switch (decision) {
      case 'confirmed_auto':
        return '자동 확정';
      case 'confirmed_human':
        return '수동 확정';
      case 'review':
        return '검토필요';
      case 'rejected':
        return '기각됨';
      case 'asking':
        return '정보필요';
      default:
        return decision;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-xl p-6 border border-indigo-100">
      <div className="mb-4">
        <h3 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📊 판정 로그
        </h3>
        <p className="text-xs text-gray-600 mt-1">최근 판정 12건</p>
      </div>

      {logs.length === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm">
          <div className="text-3xl mb-2">📋</div>
          판정 기록이 없습니다
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {logs.map((log, idx) => {
          const style = getDecisionStyle(log.decision);
          const icon = getDecisionIcon(log.decision);
          const label = getDecisionLabel(log.decision);
          const traceLines = log.trace ? log.trace.split('\n').slice(-2) : [];

          return (
            <div
              key={log.id}
              className={`rounded-lg p-3 border-l-4 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-800 text-sm truncate">{log.customer}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style.text} bg-white border ${style.border}`}>
                      {label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-1">{log.reason}</div>
                </div>
              </div>

              {traceLines.length > 0 && (
                <div className="ml-6 text-xs text-gray-500 space-y-0.5 pt-2 border-t border-gray-200 border-opacity-30">
                  {traceLines.map((line, lineIdx) => (
                    <div key={lineIdx} className="truncate opacity-75">
                      <span className="font-mono">→</span> {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
