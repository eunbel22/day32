import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import DashboardTab from './components/DashboardTab';
import BookingForm from './components/BookingForm';
import BookingTable from './components/BookingTable';
import BookingMap from './components/BookingMap';
import UnconfirmedManagement from './components/UnconfirmedManagement';
import Login from './components/Login';

type TabType = 'dashboard' | 'list' | 'add' | 'status' | 'location';

const AUTHORIZED_EMAIL = 'portfolio22keb@gmail.com';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyLocation, setCompanyLocation] = useState(() => {
    const saved = localStorage.getItem('company-location');
    return saved || '';
  });
  const [showLocationInput, setShowLocationInput] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user && user.email !== AUTHORIZED_EMAIL) {
        await supabase.auth.signOut();
        alert(`접근 권한이 없습니다.\n승인된 이메일: ${AUTHORIZED_EMAIL}`);
        setUser(null);
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user && user.email !== AUTHORIZED_EMAIL) {
        supabase.auth.signOut();
        alert(`접근 권한이 없습니다.\n승인된 이메일: ${AUTHORIZED_EMAIL}`);
        setUser(null);
      } else {
        setUser(user);
      }
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

  const handleLocationSave = () => {
    localStorage.setItem('company-location', companyLocation);
    setShowLocationInput(false);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'list', label: '예약목록' },
    { id: 'add', label: '예약추가' },
    { id: 'status', label: '미확정 관리' },
    { id: 'location', label: '위치확인' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 pb-24">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 bg-clip-text text-transparent mb-1">
              예약 관리 허브
            </h1>
            <p className="text-gray-600 text-sm">전문적인 예약 관리 시스템</p>
          </div>

          <div className="flex items-center gap-6">
            {/* 회사 위치 */}
            <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-gray-200">
              {showLocationInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    placeholder="회사 위치 입력 (예: 강남역)"
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleLocationSave}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setShowLocationInput(true)}
                >
                  <span className="text-lg">📍</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {companyLocation || '회사 위치 설정'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              {user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="프로필"
                  className="w-10 h-10 rounded-full border-2 border-blue-300 shadow-md"
                />
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md text-sm ml-2 font-medium transition-all duration-200 hover:shadow-lg"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && <DashboardTab key={refreshKey} />}

        {activeTab === 'list' && <BookingTable key={refreshKey} />}

        {activeTab === 'add' && <BookingForm onSuccess={handleFormSuccess} companyLocation={companyLocation} />}

        {activeTab === 'status' && <UnconfirmedManagement key={refreshKey} />}

        {activeTab === 'location' && <BookingMap key={refreshKey} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-2 border-blue-100 z-50">
        <div className="max-w-6xl mx-auto flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-center font-semibold transition-all duration-300 border-b-4 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-gradient-to-b from-blue-50 to-transparent'
                  : 'text-gray-600 border-transparent hover:text-blue-500 hover:border-blue-300'
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
