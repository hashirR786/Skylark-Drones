import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Database,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MondayConfig } from '../types';
import { testMondayConnection, fetchBoards } from '../services/mondayApi';

interface MondayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MondayConfig;
  onSaveConfig: (newConfig: MondayConfig) => void;
}

export const MondayConfigModal: React.FC<MondayConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [dealsBoardId, setDealsBoardId] = useState(config.dealsBoardId);
  const [workOrdersBoardId, setWorkOrdersBoardId] = useState(config.workOrdersBoardId);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [discoveredBoards, setDiscoveredBoards] = useState<Array<{ id: string; name: string }>>([]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid Monday.com API Token.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testMondayConnection(apiKey);
      if (res.success && res.user) {
        setTestResult({
          success: true,
          message: `Authenticated successfully as ${res.user.name} (${res.user.email})`,
        });

        // Auto fetch boards
        const boards = await fetchBoards(apiKey);
        setDiscoveredBoards(boards);
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Authentication failed. Please verify your Monday.com API v2 token.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      apiKey,
      dealsBoardId,
      workOrdersBoardId,
      isConnected: Boolean(apiKey && testResult?.success),
      syncStatus: 'synced',
      lastSyncedAt: new Date().toLocaleTimeString(),
    });
    onClose();
  };

  const handleResetToDemo = () => {
    setApiKey('');
    setDealsBoardId('');
    setWorkOrdersBoardId('');
    setTestResult(null);
    onSaveConfig({
      apiKey: '',
      dealsBoardId: '',
      workOrdersBoardId: '',
      isConnected: false,
      syncStatus: 'idle',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E8E8EC] shadow-2xl p-6 sm:p-8 space-y-5 text-[#1C1C1E] animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F4F4F6] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF0F5] border border-[#FCE7EA] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#E83D6F]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1C1C1E]">Monday.com Live Integration Setup</h2>
              <p className="text-xs text-[#8E8E93]">Dynamic Board Querying & Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE7EA] text-xs text-[#48484A] leading-relaxed space-y-2">
          <p className="font-bold text-[#E83D6F]">
            Enterprise Monday.com v2 GraphQL Connection
          </p>
          <p>
            Connect your live Monday.com workspace using an API Personal Token. The agent will dynamically read your <strong>Deals Funnel</strong> and <strong>Work Order Tracker</strong> boards in real-time.
          </p>
          <p className="text-[#8E8E93]">
            <strong className="text-amber-700">⚠️ CORS Note:</strong> Browser-to-Monday.com API calls may be blocked due to CORS. If connection fails, use a backend proxy or the Vercel serverless function included in this deployment.
            Without a live token, the agent runs in <strong>Enterprise Demo Mode</strong> with the full pre-normalized real dataset (346 deals, 176 work orders).
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1C1C1E] mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-[#E83D6F]" />
                <span>Monday.com Personal API Token</span>
              </span>
              <a
                href="https://support.monday.com/hc/en-us/articles/360005144820-How-to-get-your-API-key"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#E83D6F] hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Where to get API token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F8FA] border border-[#E8E8EC] text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:border-[#E83D6F] outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                Deals Funnel Board ID
              </label>
              <input
                type="text"
                value={dealsBoardId}
                onChange={(e) => setDealsBoardId(e.target.value)}
                placeholder="e.g. 1829472910"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F8FA] border border-[#E8E8EC] text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:border-[#E83D6F] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C1C1E] mb-1">
                Work Orders Board ID
              </label>
              <input
                type="text"
                value={workOrdersBoardId}
                onChange={(e) => setWorkOrdersBoardId(e.target.value)}
                placeholder="e.g. 1829472911"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F8F8FA] border border-[#E8E8EC] text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:border-[#E83D6F] outline-none font-mono"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-tight font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Discovered Boards Dropdown (if any) */}
          {discoveredBoards.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-[#E8E8EC] space-y-2">
              <span className="text-[11px] font-bold text-[#1C1C1E]">Discovered Boards in Workspace:</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                {discoveredBoards.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (!dealsBoardId) setDealsBoardId(b.id);
                      else if (!workOrdersBoardId) setWorkOrdersBoardId(b.id);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FFF5F7] border border-[#E8E8EC] text-[11px] text-[#E83D6F] font-mono flex items-center space-x-1"
                  >
                    <span>{b.name}</span>
                    <span className="text-[#8E8E93]">({b.id})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#F4F4F6] pt-4">
          <button
            onClick={handleResetToDemo}
            className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] underline font-medium"
          >
            Reset to Built-in Demo Mode
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              className="px-4 py-2 rounded-full bg-[#F4F4F6] hover:bg-[#EAEAEA] border border-[#E8E8EC] text-xs font-bold text-[#1C1C1E] flex items-center space-x-1.5 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#E83D6F]' : ''}`} />
              <span>Test API</span>
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-[#E83D6F] hover:bg-[#D92A5E] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-200 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};
