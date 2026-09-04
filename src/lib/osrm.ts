// Supabase Edge Function을 통해 거리 계산
export async function getDistanceByAddress(
  origin: string,
  destination: string
): Promise<{ distanceKm: number; durationMin: number; lat?: number; lng?: number } | null> {
  try {
    console.log(`🔍 거리 계산 요청: ${origin} → ${destination}`);

    // Supabase Edge Function 호출
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-distance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          origin,
          destination,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Edge Function 오류:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ 거리 계산 완료:', data);
    return data;
  } catch (error) {
    console.error('❌ 거리 계산 오류:', error);
    return null;
  }
}
