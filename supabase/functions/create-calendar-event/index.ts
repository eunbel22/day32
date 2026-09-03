import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface CalendarEventRequest {
  customer: string;
  service: string;
  date: string;
  time: string;
  address?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { customer, service, date, time, address } = await req.json() as CalendarEventRequest;
    const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error("Missing Google OAuth credentials");
    }

    // Access token 갱신
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // 날짜와 시간 결합
    const dateTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000); // 1시간 후

    // Google Calendar 이벤트 생성
    const eventResponse = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${customer} - ${service}`,
        description: address ? `위치: ${address}` : "주소 미지정",
        start: { dateTime: dateTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        location: address || "",
      }),
    });

    if (!eventResponse.ok) {
      const error = await eventResponse.json();
      throw new Error(`Calendar API error: ${error.error.message}`);
    }

    const eventData = await eventResponse.json() as { id: string };

    return new Response(
      JSON.stringify({ success: true, eventId: eventData.id }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
