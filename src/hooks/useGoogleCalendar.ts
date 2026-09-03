import { useCallback } from 'react';

export function useGoogleCalendar() {
  const createCalendarEvent = useCallback(
    async (
      accessToken: string | null,
      customer: string,
      service: string,
      date: string,
      time: string,
      address?: string
    ): Promise<string | null> => {
      if (!accessToken) {
        console.warn('No access token available for calendar');
        return null;
      }

      try {
        const dateTime = new Date(`${date}T${time}:00`);
        const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000);

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: `${customer} - ${service}`,
              description: address ? `위치: ${address}` : '주소 미지정',
              start: { dateTime: dateTime.toISOString() },
              end: { dateTime: endTime.toISOString() },
              location: address || '',
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json() as { error?: { message?: string } };
          console.error('Calendar API error:', error);
          return null;
        }

        const data = await response.json() as { id: string };
        console.log('✓ Calendar event created:', data.id);
        return data.id;
      } catch (err) {
        console.error('Error creating calendar event:', err);
        return null;
      }
    },
    []
  );

  const deleteCalendarEvent = useCallback(
    async (accessToken: string | null, eventId: string): Promise<boolean> => {
      if (!accessToken) {
        console.warn('No access token available for calendar');
        return false;
      }

      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok && response.status !== 404) {
          console.error('Failed to delete calendar event');
          return false;
        }

        console.log('✓ Calendar event deleted');
        return true;
      } catch (err) {
        console.error('Error deleting calendar event:', err);
        return false;
      }
    },
    []
  );

  return { createCalendarEvent, deleteCalendarEvent };
}
