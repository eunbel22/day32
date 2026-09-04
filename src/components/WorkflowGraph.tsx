import { useState, useEffect } from 'react';

interface Booking {
  id: number;
  customer: string;
  decision: string;
  [key: string]: any;
}

interface NodeDef {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  gradient: string;
}

const NODES: NodeDef[] = [
  { id: 'intake', label: '접수', icon: '📝', x: 60, y: 100, color: 'fill-blue-100 stroke-blue-400', gradient: 'from-blue-100 to-blue-50' },
  { id: 'pending', label: '대기', icon: '⏳', x: 180, y: 100, color: 'fill-amber-100 stroke-amber-400', gradient: 'from-amber-100 to-amber-50' },
  { id: 'judge', label: '판정', icon: '⚖️', x: 300, y: 100, color: 'fill-purple-100 stroke-purple-400', gradient: 'from-purple-100 to-purple-50' },
  { id: 'confirmed_auto', label: '확정\n자동', icon: '✨', x: 420, y: 30, color: 'fill-emerald-100 stroke-emerald-400', gradient: 'from-emerald-100 to-emerald-50' },
  { id: 'confirmed_human', label: '확정\n수동', icon: '✋', x: 420, y: 100, color: 'fill-cyan-100 stroke-cyan-400', gradient: 'from-cyan-100 to-cyan-50' },
  { id: 'review', label: '검토', icon: '👁️', x: 420, y: 170, color: 'fill-yellow-100 stroke-yellow-400', gradient: 'from-yellow-100 to-yellow-50' },
  { id: 'rejected', label: '기각', icon: '❌', x: 420, y: 240, color: 'fill-red-100 stroke-red-400', gradient: 'from-red-100 to-red-50' },
  { id: 'asking', label: '질문', icon: '❓', x: 420, y: 310, color: 'fill-indigo-100 stroke-indigo-400', gradient: 'from-indigo-100 to-indigo-50' },
];

interface Arrow {
  from: string;
  to: string;
  path: string;
}

const ARROWS: Arrow[] = [
  { from: 'intake', to: 'pending', path: 'M 100 100 L 140 100' },
  { from: 'pending', to: 'judge', path: 'M 220 100 L 260 100' },
  { from: 'judge', to: 'confirmed_auto', path: 'M 330 85 Q 375 45 390 30' },
  { from: 'judge', to: 'confirmed_human', path: 'M 330 100 L 390 100' },
  { from: 'judge', to: 'review', path: 'M 330 115 Q 375 170 390 170' },
  { from: 'judge', to: 'rejected', path: 'M 330 115 Q 375 240 390 240' },
  { from: 'judge', to: 'asking', path: 'M 330 115 Q 375 310 390 310' },
  { from: 'review', to: 'confirmed_human', path: 'M 420 160 Q 450 130 420 100' },
  { from: 'asking', to: 'pending', path: 'M 390 310 Q 200 220 220 130' },
  { from: 'confirmed_human', to: 'pending', path: 'M 390 100 L 220 100' },
];

export default function WorkflowGraph({ bookings }: { bookings: Booking[] }) {
  const [highlightArrow, setHighlightArrow] = useState<string | null>(null);

  useEffect(() => {
    const lastJudged = bookings
      .filter((b) => b.decision !== 'pending')
      .sort((a, b) => b.id - a.id)[0];

    if (lastJudged && lastJudged.decision !== 'pending') {
      const fromState = 'pending';
      const toState = lastJudged.decision;
      setHighlightArrow(`${fromState}->${toState}`);

      const timer = setTimeout(() => {
        setHighlightArrow(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [bookings]);

  const countByDecision = (decision: string): number => {
    if (decision === 'intake') return 0;
    return bookings.filter((b) => b.decision === decision).length;
  };

  const getCountTextColor = (decision: string): string => {
    switch (decision) {
      case 'confirmed_auto':
        return 'text-emerald-600';
      case 'confirmed_human':
        return 'text-cyan-600';
      case 'review':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      case 'asking':
        return 'text-indigo-600';
      case 'pending':
        return 'text-amber-600';
      case 'intake':
        return 'text-blue-600';
      default:
        return 'text-purple-600';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border border-purple-100">
      <div className="mb-6">
        <h3 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          ⚙️ 판정 워크플로
        </h3>
        <p className="text-sm text-gray-600 mt-1">예약이 접수부터 확정까지 거쳐가는 각 단계의 현황</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 overflow-x-auto">
        <svg width="100%" height="400" viewBox="0 0 550 350" className="min-w-max">
          {/* 그라데이션 정의 */}
          <defs>
            {NODES.map((node) => (
              <linearGradient key={`grad-${node.id}`} id={`grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={
                  node.id === 'intake' ? '#dbeafe' :
                  node.id === 'pending' ? '#fef3c7' :
                  node.id === 'judge' ? '#f3e8ff' :
                  node.id === 'confirmed_auto' ? '#d1fae5' :
                  node.id === 'confirmed_human' ? '#cffafe' :
                  node.id === 'review' ? '#fef08a' :
                  node.id === 'rejected' ? '#fee2e2' :
                  '#e0e7ff'
                } />
                <stop offset="100%" stopColor={
                  node.id === 'intake' ? '#bfdbfe' :
                  node.id === 'pending' ? '#fde68a' :
                  node.id === 'judge' ? '#e9d5ff' :
                  node.id === 'confirmed_auto' ? '#a7f3d0' :
                  node.id === 'confirmed_human' ? '#a5f3fc' :
                  node.id === 'review' ? '#fcd34d' :
                  node.id === 'rejected' ? '#fca5a5' :
                  '#c7d2fe'
                } />
              </linearGradient>
            ))}

            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#999" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#ec4899" />
            </marker>
          </defs>

          {/* 배경 그리드 */}
          <defs>
            <pattern id="dots" x="20" y="20" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#e0e7ff" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="550" height="350" fill="url(#dots)" />

          {/* 화살표들 */}
          {ARROWS.map((arrow, idx) => {
            const isHighlight = highlightArrow === `${arrow.from}->${arrow.to}`;
            return (
              <path
                key={idx}
                d={arrow.path}
                fill="none"
                stroke={isHighlight ? '#ec4899' : '#d1d5db'}
                strokeWidth={isHighlight ? 4 : 2.5}
                strokeLinecap="round"
                markerEnd={isHighlight ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                opacity={isHighlight ? 1 : 0.6}
                className={isHighlight ? 'transition-all' : ''}
              />
            );
          })}

          {/* 노드들 */}
          {NODES.map((node) => {
            const count = countByDecision(node.id);

            return (
              <g key={node.id}>
                {/* 노드 그림자 */}
                <circle cx={node.x} cy={node.y} r="40" fill="rgba(0,0,0,0.1)" filter="blur(3px)" />

                {/* 노드 배경 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="38"
                  fill={`url(#grad-${node.id})`}
                  stroke={
                    node.id === 'intake' ? '#60a5fa' :
                    node.id === 'pending' ? '#f59e0b' :
                    node.id === 'judge' ? '#a855f7' :
                    node.id === 'confirmed_auto' ? '#10b981' :
                    node.id === 'confirmed_human' ? '#06b6d4' :
                    node.id === 'review' ? '#eab308' :
                    node.id === 'rejected' ? '#ef4444' :
                    '#6366f1'
                  }
                  strokeWidth="2.5"
                />

                {/* 노드 아이콘 */}
                <text
                  x={node.x}
                  y={node.y - 5}
                  textAnchor="middle"
                  className="text-2xl"
                  style={{ fontSize: '24px' }}
                >
                  {node.icon}
                </text>

                {/* 노드 라벨 */}
                <text
                  x={node.x}
                  y={node.y + 15}
                  textAnchor="middle"
                  className="text-xs font-bold"
                  style={{ fontSize: '10px', fill: '#374151' }}
                >
                  {node.label}
                </text>

                {/* 예약 수 원형 배지 */}
                <circle cx={node.x + 28} cy={node.y - 28} r="16" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text
                  x={node.x + 28}
                  y={node.y - 22}
                  textAnchor="middle"
                  className={`text-sm font-black ${getCountTextColor(node.id)}`}
                  style={{ fontSize: '13px' }}
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"></div>
          <span className="text-gray-600">마지막 판정 (2초)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-300 rounded-full"></div>
          <span className="text-gray-600">일반 흐름</span>
        </div>
      </div>
    </div>
  );
}
