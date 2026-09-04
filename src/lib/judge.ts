export interface JudgeResult {
  route: 'ask' | 'book';
  message?: string;
  missingFields?: string[];
}

export function judge(data: {
  customer?: string;
  kind?: string;
  form?: string;
  memo?: string;
  address?: string;
  date?: string;
  slotsWanted?: string[];
}): JudgeResult {
  const missing: string[] = [];

  if (!data.customer?.trim()) missing.push('고객사');
  if (!data.kind) missing.push('종류');
  if (!data.form) missing.push('형태');
  if (!data.date) missing.push('날짜');
  if (!data.slotsWanted || data.slotsWanted.length === 0) missing.push('희망 슬롯');

  // 형태가 외근이면 위치 필수
  if (data.form === '외근' && !data.address?.trim()) {
    missing.push('위치');
  }

  if (missing.length > 0) {
    return {
      route: 'ask',
      message: `빈 칸: ${missing.join(', ')}`,
      missingFields: missing,
    };
  }

  return {
    route: 'book',
  };
}
