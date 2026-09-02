import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import StatCards from './components/StatCards';
import Weather from './components/Weather';
import BookingForm from './components/BookingForm';
import BookingTable from './components/BookingTable';
import Login from './components/Login';

type TabType = 'dashboard' | 'list' | 'add' | 'status' | 'location';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user);
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('list');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'list', label: '예약목록' },
    { id: 'add', label: '예약추가' },
    { id: 'status', label: '상태관리' },
    { id: 'location', label: '위치확인' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">예약 관리 허브</h1>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="프로필"
                className="w-10 h-10 rounded-full"
              />
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm ml-2"
            >
              로그아웃
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <Weather />
            <StatCards refreshKey={refreshKey} />
          </>
        )}

        {activeTab === 'list' && <BookingTable key={refreshKey} />}

        {activeTab === 'add' && <BookingForm onSuccess={handleFormSuccess} />}

        {activeTab === 'status' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">상태 관리</h2>
            <p className="text-gray-600 mb-4">예약의 상태를 pending(대기)에서 confirmed(확정)으로 변경합니다.</p>
            <BookingTable key={refreshKey} />
          </div>
        )}

        {activeTab === 'location' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">위치 확인</h2>
            <p className="text-gray-600 mb-4">주소를 클릭하면 Google Maps에서 위치를 확인할 수 있습니다.</p>
            <BookingTable key={refreshKey} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
