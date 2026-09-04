import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { judge } from '../lib/judge';

interface BookingFormProps {
  onSuccess?: () => void;
}

const SLOT_NAMES = ['오전 10-12', '오후-1 13-15', '오후-2 15-17'];

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [customer, setCustomer] = useState('');
  const [kind, setKind] = useState('');
  const [form, setForm] = useState('');
  const [memo, setMemo] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [slotsWanted, setSlotsWanted] = useState<boolean[]>([false, false, false]);
  const [slotOrder, setSlotOrder] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSlotChange = (index: number) => {
    const newSlots = [...slotsWanted];
    newSlots[index] = !newSlots[index];
    setSlotsWanted(newSlots);

    if (newSlots[index]) {
      // 체크됨 - 순서에 추가
      setSlotOrder([...slotOrder, index]);
    } else {
      // 체크 해제 - 순서에서 제거
      setSlotOrder(slotOrder.filter((i) => i !== index));
    }
  };

  const getSlotNumber = (index: number): number | null => {
    const pos = slotOrder.indexOf(index);
    return pos >= 0 ? pos + 1 : null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // 판정
    const judgeResult = judge({
      customer,
      kind,
      form,
      memo,
      address,
      date,
      slotsWanted: slotOrder.map((i) => SLOT_NAMES[i]),
    });

    if (judgeResult.route === 'ask') {
      setError(judgeResult.message || '정보를 확인하세요');
      return;
    }

    setLoading(true);

    // slots_wanted 저장 형식
    const slotsWantedStr = slotOrder.map((i) => SLOT_NAMES[i]).join(',');

    const { error: insertError } = await supabase.from('bookings').insert({
      customer,
      kind,
      form,
      memo,
      address: form === '외근' ? address : null,
      date,
      slots_wanted: slotsWantedStr,
      service: memo,
      decision: 'pending',
      status: 'pending',
      time: '', // time 칸은 빈 문자열 저장
    });

    if (insertError) {
      setError(`예약 추가 실패: ${insertError.message}`);
      setLoading(false);
    } else {
      setCustomer('');
      setKind('');
      setForm('');
      setMemo('');
      setAddress('');
      setDate('');
      setSlotsWanted([false, false, false]);
      setSlotOrder([]);
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          예약 추가
        </h2>
        {error && (
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            {error.includes('빈 칸') ? '완료 안 함' : '완료됨'}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* 고객사 */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-blue-600 mb-2">고객사 *</label>
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="고객사명"
        />
      </div>

      {/* 종류 */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-blue-600 mb-2">종류 *</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">선택하세요</option>
          <option value="서울">서울</option>
          <option value="경기">경기</option>
          <option value="지방">지방</option>
          <option value="내부">내부</option>
        </select>
      </div>

      {/* 형태 */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-blue-600 mb-2">형태 *</label>
        <select
          value={form}
          onChange={(e) => setForm(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">선택하세요</option>
          <option value="외근">외근</option>
          <option value="온라인">온라인</option>
        </select>
      </div>

      {/* 메모 */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-blue-600 mb-2">메모 *</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="예: 미팅, 기획 회의"
          maxLength={100}
        />
      </div>

      {/* 위치 - 형태가 외근일 때만 표시 */}
      {form === '외근' && (
        <div className="mb-4">
          <label className="block text-sm font-bold text-blue-600 mb-2">위치 *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="방문 위치"
          />
        </div>
      )}

      {/* 날짜 */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-blue-600 mb-2">날짜 *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 희망 슬롯 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-blue-600 mb-3">희망 슬롯 *</label>
        <div className="space-y-2">
          {SLOT_NAMES.map((name, index) => (
            <label key={index} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={slotsWanted[index]}
                onChange={() => handleSlotChange(index)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <span className="text-sm font-medium text-gray-700">{name}</span>
              {getSlotNumber(index) && (
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                  {getSlotNumber(index)}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || (error !== '' && error.includes('빈 칸'))}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? '추가 중...' : '✓ 예약하기'}
      </button>
    </form>
  );
}
