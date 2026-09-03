import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AUTHORIZED_EMAIL = 'portfolio22keb@gmail.com';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error logging in:', error);
    }
  };

  // 앱 로드 시 이메일 검증
  useEffect(() => {
    const checkAuthorizedUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const userEmail = data.session.user.email;
        if (userEmail !== AUTHORIZED_EMAIL) {
          await supabase.auth.signOut();
          alert(`접근 권한이 없습니다.\n승인된 이메일: ${AUTHORIZED_EMAIL}`);
        }
      }
    };

    checkAuthorizedUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userEmail = session.user.email;
        if (userEmail !== AUTHORIZED_EMAIL) {
          supabase.auth.signOut();
          alert(`접근 권한이 없습니다.\n승인된 이메일: ${AUTHORIZED_EMAIL}`);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full backdrop-blur-lg">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 bg-clip-text text-transparent text-center mb-3">
            예약 관리 허브
          </h1>
          <p className="text-gray-600 text-center font-medium">Google로 로그인하여 시작하세요</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </button>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center font-medium">
            보안된 Google 계정으로만 로그인할 수 있습니다
          </p>
          <p className="text-xs text-gray-400 text-center mt-2">
            당신의 정보는 안전하게 보호됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
