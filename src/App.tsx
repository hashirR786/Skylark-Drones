import React, { useState } from 'react';
import { Sidebar, Header } from './components/Navbar';
import { ChatInterface } from './components/ChatInterface';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LeadershipStudio } from './components/LeadershipStudio';
import { DataExplorer } from './components/DataExplorer';
import { MondayConfigModal } from './components/MondayConfigModal';
import { INITIAL_DEALS, INITIAL_WORK_ORDERS } from './data/mockData';
import { Deal, WorkOrder, MondayConfig, CrossBoardMetrics } from './types';
import { computeOverallMetrics } from './services/dataResilience';
import { fetchBoardItems, mapMondayItemsToDeals, mapMondayItemsToWorkOrders } from './services/mondayApi';

// Monday.com API token (provided by the user)
const MONDAY_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY5ODM1MzUzNywiYWFpIjoxMSwidWlkIjoxMTQ3OTA0MTAsImlhZCI6IjIwMjYtMDgtMzBUMTM6MDI6MTAuNTgyWiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2NjcyMDE1LCJyZ24iOiJhcHNlMiJ9.Z5cHpuRnrbDIDuY9P__3gEZkxdEn5kafcd5rl-AgS-Q';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'leadership' | 'explorer' | 'monday'>('dashboard');
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');

  // Pre-load the Monday.com API token and discovered boards
  const [mondayConfig, setMondayConfig] = useState<MondayConfig>({
    apiKey: MONDAY_API_TOKEN,
    dealsBoardId: '5030971698',
    workOrdersBoardId: '5030971683',
    isConnected: true,
    syncStatus: 'synced',
  });

  const metrics: CrossBoardMetrics = computeOverallMetrics(deals, workOrders);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);

    if (mondayConfig.isConnected && mondayConfig.apiKey && (mondayConfig.dealsBoardId || mondayConfig.workOrdersBoardId)) {
      try {
        if (mondayConfig.dealsBoardId) {
          const fetchedDeals = await fetchBoardItems(mondayConfig.apiKey, mondayConfig.dealsBoardId);
          const mappedDeals = mapMondayItemsToDeals(fetchedDeals.items);
          if (mappedDeals.length > 0) setDeals(mappedDeals);
        }
        if (mondayConfig.workOrdersBoardId) {
          const fetchedWOs = await fetchBoardItems(mondayConfig.apiKey, mondayConfig.workOrdersBoardId);
          const mappedWOs = mapMondayItemsToWorkOrders(fetchedWOs.items);
          if (mappedWOs.length > 0) setWorkOrders(mappedWOs);
        }
        showNotification('Successfully synced live data from Monday.com boards!', 'success');
      } catch (err: any) {
        showNotification(`Monday.com sync notice: ${err.message || 'Falling back to cached data'}`, 'info');
      }
    } else {
      setTimeout(() => {
        setDeals([...INITIAL_DEALS]);
        setWorkOrders([...INITIAL_WORK_ORDERS]);
        showNotification('Refreshed & re-indexed 346 deals and 176 work orders dataset.', 'success');
      }, 500);
    }

    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleSearchFromHeader = (query: string) => {
    setInitialSearchQuery(query);
    setActiveTab('chat');
  };

  return (
    // Full viewport height, no scroll on outer shell — everything is contained inside
    <div className="h-screen overflow-hidden bg-[#ECECEE] text-[#1C1C1E] p-3 sm:p-5 lg:p-6 font-sans selection:bg-[#E83D6F] selection:text-white flex flex-col">
      {/* Outer Floating Rounded Card — fills all available height */}
      <div className="flex-1 w-full max-w-[1680px] mx-auto bg-white rounded-[32px] border border-[#E5E5EA] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col lg:flex-row min-h-0">

        {/* Left Double-Rail Sidebar — static, does not scroll with content */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mondayConfig={mondayConfig}
          metrics={metrics}
          onOpenConfig={() => setIsConfigOpen(true)}
          isSyncing={isSyncing}
          onSync={handleSyncData}
          onSearchQuery={handleSearchFromHeader}
        />

        {/* Right Main Content Area — fills remaining width, flex column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#FAFAFC]">
          {/* Top Header — static, never scrolls */}
          <Header
            activeTab={activeTab}
            mondayConfig={mondayConfig}
            metrics={metrics}
            onOpenConfig={() => setIsConfigOpen(true)}
            isSyncing={isSyncing}
            onSync={handleSyncData}
            onSearch={handleSearchFromHeader}
          />

          {/* Main Content — each view manages its own scroll behaviour */}
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeTab === 'dashboard' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnalyticsDashboard deals={deals} workOrders={workOrders} metrics={metrics} />
              </div>
            )}

            {activeTab === 'chat' && (
              // Chat: messages scroll, header chips and input bar are pinned
              <ChatInterface deals={deals} workOrders={workOrders} initialQuery={initialSearchQuery} />
            )}

            {activeTab === 'leadership' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <LeadershipStudio deals={deals} workOrders={workOrders} />
              </div>
            )}

            {activeTab === 'explorer' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <DataExplorer deals={deals} workOrders={workOrders} />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border flex items-center space-x-2 ${
            notification.type === 'success' ? 'bg-[#1C1C1E] border-[#2C2C2E] text-white' :
            notification.type === 'error' ? 'bg-[#801B3A] border-[#E83D6F] text-white' :
            'bg-[#1C1C1E] border-[#E83D6F] text-[#E83D6F]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#E83D6F] animate-pulse" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Monday Configuration Modal */}
      <MondayConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={mondayConfig}
        onSaveConfig={(newCfg) => {
          setMondayConfig(newCfg);
          showNotification(newCfg.isConnected ? 'Connected to Monday.com live boards!' : 'Running in Enterprise Demo Mode', 'success');
        }}
      />
    </div>
  );
}

export default App;
