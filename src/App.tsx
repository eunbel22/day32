import { useState } from 'react';
import StatCards from './components/StatCards';
import BookingForm from './components/BookingForm';
import BookingTable from './components/BookingTable';

type TabType = 'dashboard' | 'list' | 'add' | 'status' | 'location';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('list');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'list', label: '예약목록' },
    { id: 'add', label: '예약추가' },
    { id: 'status', label: '상태관리' },
    { id: 'location', label: '위치확인' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">예약 관리 허브</h1>

        {activeTab === 'dashboard' && <StatCards refreshKey={refreshKey} />}

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
