import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GeocodeRequest {
  origin: string;
  destination: string;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  distanceKm: number;
  durationMin: number;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=kr`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "BookingHub/1.0",
      },
    });

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMin: number } | null> {
  try {
    const url = `https://router.project-osrm.org/table/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?annotations=distance,duration`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok") {
      const distance = data.distances[0][1] / 1000; // meters → km
      const duration = Math.round(data.durations[0][1] / 60); // seconds → minutes

      return {
        distanceKm: Math.round(distance * 10) / 10,
        durationMin: duration,
      };
    }

    return null;
  } catch (error) {
    console.error("Distance calculation error:", error);
    return null;
  }
}

serve(async (req: Request) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { origin, destination } = (await req.json()) as GeocodeRequest;

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: "origin과 destination이 필요합니다" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 출발지 좌표 구하기
    const originCoords = await geocodeAddress(origin);
    if (!originCoords) {
      return new Response(
        JSON.stringify({ error: `출발지를 찾을 수 없습니다: ${origin}` }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 목적지 좌표 구하기
    const destCoords = await geocodeAddress(destination);
    if (!destCoords) {
      return new Response(
        JSON.stringify({ error: `목적지를 찾을 수 없습니다: ${destination}` }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 거리 및 시간 계산
    const distanceInfo = await calculateDistance(originCoords, destCoords);
    if (!distanceInfo) {
      return new Response(
        JSON.stringify({ error: "거리 계산에 실패했습니다" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const result: GeocodeResponse = {
      lat: destCoords.lat,
      lng: destCoords.lng,
      ...distanceInfo,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
