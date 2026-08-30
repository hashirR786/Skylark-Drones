import React, { useState } from 'react';
import { 
  Bot, 
  BarChart3, 
  FileText, 
  Database, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Plus, 
  Settings, 
  RefreshCw, 
  Layers,
  TrendingUp,
  AlertTriangle,
  Zap,
  Building2,
  Clock,
  DollarSign,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { MondayConfig, CrossBoardMetrics } from '../types';

interface SidebarProps {
  activeTab: 'chat' | 'dashboard' | 'leadership' | 'explorer' | 'monday';
  setActiveTab: (tab: 'chat' | 'dashboard' | 'leadership' | 'explorer' | 'monday') => void;
  mondayConfig: MondayConfig;
  metrics: CrossBoardMetrics;
  onOpenConfig: () => void;
  isSyncing: boolean;
  onSync: () => void;
  onSearchQuery?: (q: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mondayConfig,
  metrics,
  onOpenConfig,
  isSyncing,
  onSync,
  onSearchQuery,
}) => {
  const [queriesExpanded, setQueriesExpanded] = useState(true);
  const [sectorsExpanded, setSectorsExpanded] = useState(true);

  const handleQuery = (query: string) => {
    setActiveTab('chat');
    if (onSearchQuery) onSearchQuery(query);
  };

  // Main navigation views — the four real modules
  const mainViews = [
    {
      id: 'dashboard' as const,
      label: 'Analytics Dashboard',
      icon: BarChart3,
      desc: 'Sales & pipeline overview',
    },
    {
      id: 'chat' as const,
      label: 'AI Agent',
      icon: Bot,
      desc: 'Ask business questions',
    },
    {
      id: 'leadership' as const,
      label: 'Leadership Briefing',
      icon: FileText,
      desc: 'Board-ready reports',
    },
    {
      id: 'explorer' as const,
      label: 'Data Explorer',
      icon: Database,
      desc: 'Raw deal & work order data',
    },
  ];

  // Founder-level quick query shortcuts from the assignment
  const founderQueries = [
    {
      icon: TrendingUp,
      label: 'Pipeline health',
      query: "How's our overall sales pipeline health this quarter?",
    },
    {
      icon: Zap,
      label: 'Energy sector pipeline',
      query: "How's our pipeline looking for energy sector this quarter?",
    },
    {
      icon: AlertTriangle,
      label: 'AR risk accounts',
      query: 'What is our total outstanding AR and priority risk accounts?',
    },
    {
      icon: Clock,
      label: 'Deals closing in 30 days',
      query: 'Which deals are closing in the next 30 days?',
    },
    {
      icon: Building2,
      label: 'Mining sector status',
      query: 'What is the mining sector delivery performance and pipeline?',
    },
    {
      icon: Activity,
      label: 'Delivery turnaround',
      query: 'Show operational delivery turnaround time across all sectors',
    },
    {
      icon: DollarSign,
      label: 'Won vs. billed gap',
      query: 'Compare closed won deals vs operational billing — what is the revenue gap?',
    },
  ];

  // Real sectors from the data
  const sectors = [
    { label: 'Tender', color: '#3B82F6', query: "How's our Tender sector pipeline this quarter?" },
    { label: 'Railways', color: '#8B5CF6', query: 'What is the railways sector delivery performance and pipeline?' },
    { label: 'DSP', color: '#F59E0B', query: 'Show DSP sector deals and work order status' },
    { label: 'Mining', color: '#6B7280', query: 'What is the mining sector delivery performance and pipeline?' },
    { label: 'Powerline', color: '#EF4444', query: 'What is the powerline sector status and outstanding AR?' },
    { label: 'Renewables', color: '#10B981', query: "How's our pipeline looking for energy sector this quarter?" },
  ];

  return (
    <>
      {/* Left Icon Rail + Navigation Tree */}
      <aside className="w-64 lg:w-72 bg-[#FAFAFC] border-r border-[#E8E8EC] flex flex-row flex-shrink-0 select-none h-full overflow-hidden">
        {/* Rail 1: Slim Icon Bar */}
        <div className="w-16 border-r border-[#EAEAEA] flex flex-col items-center justify-between py-5 bg-[#F6F6F8] h-full flex-shrink-0">
          {/* Brand Logo Circle */}
          <div className="flex flex-col items-center space-y-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="w-10 h-10 rounded-full bg-[#121215] text-white flex items-center justify-center font-extrabold text-base shadow-sm hover:scale-105 transition-transform"
              title="Skylark Drones BI Agent"
            >
              <span>S</span>
            </button>

            {/* Core Nav Icons */}
            <div className="flex flex-col items-center space-y-3">
              {mainViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveTab(view.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === view.id
                        ? 'bg-[#E83D6F] text-white shadow-md shadow-rose-200'
                        : 'text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white'
                    }`}
                    title={view.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Settings */}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={onOpenConfig}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                mondayConfig.isConnected
                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white'
              }`}
              title="Monday.com Integration Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rail 2: Tree View — Contextual Content */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar text-[13px]">
          <div className="p-4 space-y-5">
            {/* Workspace Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-[#1C1C1E] tracking-tight">SkylarkDrones.com</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />
              </div>
            </div>

            {/* Main Module Navigation */}
            <div className="space-y-0.5">
              {mainViews.map((view) => {
                const Icon = view.icon;
                const isActive = activeTab === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveTab(view.id)}
                    className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl transition-all text-left group ${
                      isActive
                        ? 'bg-white shadow-sm text-[#1C1C1E]'
                        : 'text-[#6E6E73] hover:bg-white hover:text-[#1C1C1E]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-[#E83D6F]/10' : 'bg-[#F0F0F2] group-hover:bg-[#E83D6F]/10'
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E83D6F]' : 'text-[#8E8E93] group-hover:text-[#E83D6F]'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isActive ? 'text-[#1C1C1E]' : ''}`}>{view.label}</div>
                      <div className="text-[10px] text-[#8E8E93] truncate">{view.desc}</div>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E83D6F] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Founder Queries */}
            <div className="space-y-1">
              <div
                onClick={() => setQueriesExpanded(!queriesExpanded)}
                className="flex items-center justify-between px-2 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider cursor-pointer hover:text-[#1C1C1E] transition-colors"
              >
                <span>Founder Quick Queries</span>
                {queriesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </div>

              {queriesExpanded && (
                <div className="pl-2 border-l border-[#E5E5EA] ml-3 space-y-0.5 mt-1">
                  {founderQueries.map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuery(q.query)}
                        className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[#6E6E73] hover:text-[#E83D6F] hover:bg-rose-50 text-left transition-all group text-xs"
                      >
                        <Icon className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                        <span className="truncate">{q.label}</span>
                        <ArrowUpRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sectors */}
            <div className="space-y-1">
              <div
                onClick={() => setSectorsExpanded(!sectorsExpanded)}
                className="flex items-center justify-between px-2 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider cursor-pointer hover:text-[#1C1C1E] transition-colors"
              >
                <span>Sectors in Pipeline</span>
                {sectorsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </div>

              {sectorsExpanded && (
                <div className="pl-2 border-l border-[#E5E5EA] ml-3 space-y-0.5 mt-1">
                  {sectors.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuery(s.query)}
                      className="w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white text-left transition-all text-xs group"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate">{s.label}</span>
                      <ArrowUpRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Data Source Status */}
          <div className="p-4 border-t border-[#EAEAEA] space-y-2">
            {/* Data Source Status */}
            <div className="px-2 py-2 rounded-xl bg-white border border-[#E8E8EC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Data Sources</span>
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  title="Refresh data"
                  className="text-[#8E8E93] hover:text-[#E83D6F] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#E83D6F]' : ''}`} />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[#48484A] font-medium">Deals Funnel</span>
                  </div>
                  <span className="text-[#8E8E93]">346 records</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[#48484A] font-medium">Work Orders</span>
                  </div>
                  <span className="text-[#8E8E93]">176 records</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${mondayConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-[#48484A] font-medium">Monday.com</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${mondayConfig.isConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {mondayConfig.isConnected ? 'Live' : 'Demo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manage Integration */}
            <button
              onClick={onOpenConfig}
              className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white text-xs font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Configure Monday.com API</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Header: React.FC<{
  activeTab: string;
  mondayConfig: MondayConfig;
  metrics: CrossBoardMetrics;
  onOpenConfig: () => void;
  isSyncing: boolean;
  onSync: () => void;
  onSearch: (query: string) => void;
}> = ({
  activeTab,
  mondayConfig,
  metrics,
  onOpenConfig,
  isSyncing,
  onSync,
  onSearch,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <header className="h-16 px-6 border-b border-[#E8E8EC] bg-white flex items-center justify-between gap-4">
      {/* Search Input Pill */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try searching "pipeline in energy" or "AR risks"...'
          className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F5F5F7] border border-transparent focus:border-[#E83D6F] focus:bg-white text-xs text-[#1C1C1E] placeholder-[#8E8E93] outline-none transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Data Quality Chip */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F6] text-xs font-semibold text-[#48484A]">
          <span className="text-[#8E8E93] font-normal">Resilience:</span>
          <span className="text-emerald-600 font-bold">{metrics.dataQualityScore}%</span>
        </div>

        {/* Monday.com Status Pill */}
        <button
          onClick={onOpenConfig}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            mondayConfig.isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-[#F5F5F7] border-[#E8E8EC] text-[#48484A] hover:bg-[#ECECEE]'
          }`}
          title="Monday.com Integration"
        >
          <div className={`w-2 h-2 rounded-full ${mondayConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="hidden md:inline">
            {mondayConfig.isConnected ? 'Monday.com: Live' : 'Monday.com: Demo'}
          </span>
          <Settings className="w-3 h-3 text-[#8E8E93]" />
        </button>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEA] border border-[#E8E8EC] flex items-center justify-center text-[#48484A] transition-all disabled:opacity-50"
          title="Sync Monday.com Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#E83D6F]' : ''}`} />
        </button>

        {/* Quick Briefing Action Button */}
        <button
          onClick={() => onSearch("Prepare an Executive Leadership Briefing for next week's board meeting")}
          className="w-9 h-9 rounded-full bg-[#E83D6F] hover:bg-[#D92A5E] text-white flex items-center justify-center shadow-md shadow-rose-200 transition-all"
          title="Generate Leadership Briefing"
        >
          <Plus className="w-4 h-4 font-bold" />
        </button>
      </div>
    </header>
  );
};
