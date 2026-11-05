import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import { Login } from './pages/Login';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { StaffProfileModal } from './components/StaffProfileModal';

import { LiveOrders } from './pages/kitchen/LiveOrders';
import { KitchenStock } from './pages/kitchen/KitchenStock';
import { LiveMenu } from './pages/kitchen/LiveMenu';

import { MyTables } from './pages/waiter/MyTables';
import { AvailableTables } from './pages/waiter/AvailableTables';
import { MyOrders } from './pages/waiter/MyOrders';
import { Requests } from './pages/waiter/Requests';
import { Groups } from './pages/waiter/Groups';

import { Bills } from './pages/accountant/Bills';
import { VerifyReceipt } from './pages/accountant/VerifyReceipt';
import { DayClose } from './pages/accountant/DayClose';
import { PettyCash } from './pages/accountant/PettyCash';

import { Attendance } from './pages/shared/Attendance';
import { Leave } from './pages/shared/Leave';

function Dashboard() {
  const { user } = useApp();
  const defaultTab = user?.role === 'kitchen' ? 'live-orders'
    : user?.role === 'waiter' ? 'my-tables'
      : 'bills';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'kitchen') {
      setActiveTab('live-orders');
    } else if (user?.role === 'waiter') {
      setActiveTab('my-tables');
    } else if (user?.role === 'accountant') {
      setActiveTab('bills');
    }
  }, [user?.role, user?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'live-orders': return <LiveOrders />;
      case 'kitchen-stock': return <KitchenStock />;
      case 'live-menu': return <LiveMenu />;
      case 'my-tables': return <MyTables />;
      case 'available': return <AvailableTables />;
      case 'my-orders': return <MyOrders />;
      case 'requests': return <Requests />;
      case 'groups': return <Groups />;
      case 'bills': return <Bills />;
      case 'verify': return <VerifyReceipt />;
      case 'day-close': return <DayClose />;
      case 'petty-cash': return <PettyCash />;
      case 'attendance': return <Attendance />;
      case 'leave': return <Leave />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-app relative">
      <div className="app-bg">
        <div className="grid-pattern" />
      </div>
      <div className="relative z-10">
        <Header onOpenProfile={() => setProfileOpen(true)} />
        <div className="flex">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onOpenProfile={() => setProfileOpen(true)} />
          <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
            {renderContent()}
          </main>
        </div>
      </div>
      <StaffProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <ToastContainer />
    </div>
  );
}

function AppInner() {
  const { user } = useApp();
  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
