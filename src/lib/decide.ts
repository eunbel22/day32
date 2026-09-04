import { requiredSlots, occupied, SLOTS } from './slots';

export interface DecideResult {
  decision: 'asking' | 'rejected' | 'review' | 'pending' | 'confirmed_auto' | 'confirmed_human';
  reason: string;
  options?: string;
  slotAssigned?: string;
  candidate?: string;
  trace: string[];
}

export function decide(
  booking: {
    id?: number;
    customer: string;
    kind: string;
    date: string;
    slots_wanted: string;
  },
  allBookings: any[],
  autoOn: boolean
): DecideResult {
  const trace: string[] = [];

  // 1. 빈 칸 검사
  const missing: string[] = [];
  if (!booking.kind) missing.push('종류');
  if (!booking.date) missing.push('날짜');
  if (!booking.slots_wanted) missing.push('희망 슬롯');

  if (missing.length > 0) {
    trace.push(`1 빈 칸 검사: ${missing.join(', ')}`);
    return {
      decision: 'asking',
      reason: `빈 칸: ${missing.join(', ')}`,
      trace,
    };
  }

  trace.push('1 빈 칸 검사: 없음');

  // slots_wanted 파싱
  const slotsWantedArray = booking.slots_wanted
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (slotsWantedArray.length === 0) {
    trace.push('1 빈 칸 검사: 희망 슬롯이 0개');
    return {
      decision: 'asking',
      reason: '희망 슬롯을 선택하세요',
      trace,
    };
  }

  // 2. 필요한 칸 계산
  const firstSlot = slotsWantedArray[0];
  const neededSlots = requiredSlots(booking.kind, firstSlot);
  const neededCount = neededSlots.length;
  trace.push(
    `2 종류 ${booking.kind} -> 필요한 칸 ${neededCount}개 (희망 ${slotsWantedArray.join(', ')})`
  );

  // 3. 그 날짜의 점유 상황
  const occupiedSlots = occupied(booking.date, allBookings);
  const slotStatus = SLOTS.map((slot) => `${slot} ${occupiedSlots.has(slot) ? 'X' : 'O'}`).join(', ');
  trace.push(`3 ${booking.date} 달력: ${slotStatus}`);

  // 4. 희망 슬롯 중 가능한 후보 찾기
  const candidates: string[] = [];
  for (const slot of slotsWantedArray) {
    const needed = requiredSlots(booking.kind, slot);
    if (needed.every((s) => !occupiedSlots.has(s))) {
      candidates.push(slot);
    }
  }

  const candidateStr =
    candidates.length > 0
      ? candidates.map((c) => requiredSlots(booking.kind, c).join('+')).join(', ')
      : '(없음)';
  trace.push(`4 희망 순서대로 필요한 칸이 전부 O 인 후보: ${candidateStr}`);

  // 후보 없음 -> rejected
  if (candidates.length === 0) {
    const availableSlots = SLOTS.filter((slot) => !occupiedSlots.has(slot));
    const availableStr = availableSlots.length > 0 ? availableSlots.join(', ') : '(없음)';
    trace.push(`그 날 빈 칸 목록: ${availableStr}`);
    trace.push('결과: 거부됨 - 희망 슬롯 전부 찼음');
    return {
      decision: 'rejected',
      reason: '희망 슬롯 전부 찼음',
      options: availableStr,
      trace,
    };
  }

  // 5. 같은 날짜의 다른 pending 예약 중 유일 후보가 내 첫 후보와 겹치는 경우
  const myFirstCandidate = candidates[0];
  const myFirstNeeded = requiredSlots(booking.kind, myFirstCandidate);
  const myFirstNeededStr = myFirstNeeded.join('+');

  const otherPendingBookings = allBookings.filter(
    (b) =>
      b.date === booking.date &&
      b.decision === 'pending' &&
      (!booking.id || b.id !== booking.id)
  );

  let hasConflict = false;
  let conflictCustomer = '';

  for (const other of otherPendingBookings) {
    if (!other.slots_wanted) continue;

    const otherSlots = other.slots_wanted
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // 다른 예약의 후보들 확인
    const otherCandidates: string[] = [];
    for (const slot of otherSlots) {
      const needed = requiredSlots(other.kind, slot);
      if (needed.every((s) => !occupiedSlots.has(s) && !myFirstNeeded.includes(s))) {
        otherCandidates.push(slot);
      }
    }

    // 다른 예약의 유일 후보가 내 첫 후보와 겹치는지 확인
    if (otherCandidates.length === 1) {
      const otherFirstCandidate = otherCandidates[0];
      const otherFirstNeeded = requiredSlots(other.kind, otherFirstCandidate);
      const otherFirstNeededStr = otherFirstNeeded.join('+');

      if (otherFirstNeededStr === myFirstNeededStr) {
        hasConflict = true;
        conflictCustomer = other.customer;
        break;
      }
    }
  }

  if (hasConflict) {
    trace.push(`5 같은 날 대기 요청: (${conflictCustomer})의 유일 후보 ${myFirstNeededStr} (겹침)`);
    trace.push(`결과: 사람이 정해야 함 - ${conflictCustomer} 도 같은 칸이 유일 후보`);
    return {
      decision: 'review',
      reason: `동점 - ${conflictCustomer} 도 같은 칸이 유일 후보`,
      options: `${booking.customer},${conflictCustomer}`,
      trace,
    };
  }

  trace.push('5 같은 날 대기 요청 비교: 겹치는 유일 후보 없음');

  // 6. autoOn에 따라 결정
  if (autoOn) {
    trace.push(`결과: 확정-자동 - ${myFirstNeededStr} 확정`);
    return {
      decision: 'confirmed_auto',
      reason: `빈 칸 ${myFirstNeededStr} 확정`,
      slotAssigned: myFirstNeededStr,
      trace,
    };
  } else {
    trace.push(`결과: 대기 - ${myFirstNeededStr} 후보 (확정 버튼 대기)`);
    return {
      decision: 'pending',
      reason: `후보 ${myFirstNeededStr} - 확정 버튼 대기`,
      candidate: myFirstNeededStr,
      trace,
    };
  }
}
