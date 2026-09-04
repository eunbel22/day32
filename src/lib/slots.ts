export const SLOTS = ['오전', '오후-1', '오후-2'] as const;

export const NEED: Record<string, number> = {
  서울: 1,
  내부: 1,
  경기: 2,
  지방: 3,
};

export function requiredSlots(kind: string, slot: string): string[] {
  if (kind === '서울' || kind === '내부') {
    return [slot];
  }

  if (kind === '경기') {
    if (slot === '오전') return ['오전', '오후-1'];
    if (slot === '오후-1') return ['오후-1', '오후-2'];
    if (slot === '오후-2') return ['오후-1', '오후-2'];
  }

  if (kind === '지방') {
    return ['오전', '오후-1', '오후-2'];
  }

  return [slot];
}

export function occupied(
  date: string,
  bookings: any[]
): Set<string> {
  const occupiedSlots = new Set<string>();

  bookings.forEach((booking) => {
    if (
      booking.date === date &&
      (booking.decision === 'confirmed_auto' || booking.decision === 'confirmed_human')
    ) {
      if (booking.slot_assigned) {
        booking.slot_assigned.split(',').forEach((slot: string) => {
          occupiedSlots.add(slot.trim());
        });
      }
    }
  });

  return occupiedSlots;
}
