import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

export function useGoogleCalendarAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 기존 provider_token으로 시도하기
    const checkProviderToken = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          headers: { 'Accept': 'application/json' },
        }).catch(() => null);

        if (response?.ok) {
          const session = await response.json();
          if (session?.provider_token) {
            setAccessToken(session.provider_token);
          }
        }
      } catch (err) {
        console.log('Provider token not available, will use GIS');
      }
    };

    checkProviderToken();
  }, []);

  const requestCalendarAccess = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID not configured');
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise<string | null>((resolve) => {
      const handleCodeResponse = async (response: any) => {
        try {
          // Authorization code를 access token으로 교환
          // 참고: 실제로는 backend가 필요하지만, Google's implicit flow 사용
          if (response.access_token) {
            setAccessToken(response.access_token);
            setLoading(false);
            resolve(response.access_token);
          }
        } catch (err) {
          setError('Failed to get access token');
          setLoading(false);
          resolve(null);
        }
      };

      // GIS 토큰 클라이언트 초기화 (calendar scope 포함)
      if (!window.google) {
        setError('Google API not loaded');
        setLoading(false);
        resolve(null);
        return;
      }

      try {
        // One Tap으로 calendar 권한 요청
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCodeResponse,
        });

        // 토큰 클라이언트 생성 (calendar scope 포함)
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/calendar',
          prompt: 'consent',
          callback: handleCodeResponse,
        });

        tokenClient.requestAccessToken();
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        resolve(null);
      }
    });
  }, []);

  return { accessToken, requestCalendarAccess, loading, error };
}
