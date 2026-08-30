import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet,
  Tag
} from 'lucide-react';
import { Deal, WorkOrder } from '../types';
import { formatCurrencyINR } from '../services/dataResilience';

interface DataExplorerProps {
  deals: Deal[];
  workOrders: WorkOrder[];
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ deals, workOrders }) => {
  const [activeBoard, setActiveBoard] = useState<'deals' | 'work_orders'>('deals');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Filter Deals
  const filteredDeals = deals.filter((d) => {
    const matchesSearch = 
      d.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ownerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.dealStage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || d.sector.toLowerCase() === sectorFilter.toLowerCase();
    const matchesAnomaly = !anomalyOnly || d.anomalies.length > 0;
    return matchesSearch && matchesSector && matchesAnomaly;
  });

  // Filter Work Orders
  const filteredWOs = workOrders.filter((w) => {
    const matchesSearch = 
      w.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.executionStatus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || w.sector.toLowerCase() === sectorFilter.toLowerCase();
    const matchesAnomaly = !anomalyOnly || w.anomalies.length > 0;
    return matchesSearch && matchesSector && matchesAnomaly;
  });

  const exportCSV = () => {
    const dataToExport = activeBoard === 'deals' ? filteredDeals : filteredWOs;
    const header = Object.keys(dataToExport[0] || {}).filter(k => k !== 'rawData').join(',');
    const rows = dataToExport.map(item => {
      return Object.entries(item)
        .filter(([k]) => k !== 'rawData')
        .map(([_, v]) => `"${Array.isArray(v) ? v.join('; ') : (v ?? '')}"`)
        .join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Skylark_${activeBoard}_Cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sectors = Array.from(
    new Set([
      ...deals.map(d => d.sector),
      ...workOrders.map(w => w.sector),
    ])
  ).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-[#1C1C1E]">
      {/* Top Header & Board Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8EC] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA]">
              Cross-Board Data Explorer
            </span>
            <span className="text-xs text-[#8E8E93]">Live Normalization & Audit</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight mt-1">
            {activeBoard === 'deals' ? 'Sales Deal Funnel Records' : 'Work Order Execution & AR Records'}
          </h1>
        </div>

        {/* Board Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#F4F4F6] p-1 rounded-full flex items-center space-x-1">
            <button
              onClick={() => setActiveBoard('deals')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeBoard === 'deals'
                  ? 'bg-[#131316] text-white shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1C1C1E]'
              }`}
            >
              Deals Funnel ({deals.length})
            </button>
            <button
              onClick={() => setActiveBoard('work_orders')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeBoard === 'work_orders'
                  ? 'bg-[#131316] text-white shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1C1C1E]'
              }`}
            >
              Work Orders ({workOrders.length})
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E8E8EC] text-xs font-bold text-[#E83D6F] flex items-center space-x-1.5 shadow-sm transition-all"
            title="Export Cleaned Dataset as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search deals, clients, serial #, owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#E8E8EC] text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:border-[#E83D6F] outline-none shadow-sm"
          />
        </div>

        {/* Sector Filter */}
        <div className="flex items-center space-x-2 bg-white border border-[#E8E8EC] rounded-full px-3.5 py-1.5 shadow-sm">
          <Filter className="w-4 h-4 text-[#8E8E93]" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            aria-label="Filter Explorer by Sector"
            className="w-full bg-transparent text-xs text-[#1C1C1E] font-semibold outline-none cursor-pointer"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Anomaly Only Checkbox */}
        <label className="flex items-center space-x-2.5 bg-white border border-[#E8E8EC] rounded-full px-4 py-2 cursor-pointer hover:bg-[#FBFBFC] shadow-sm">
          <input
            type="checkbox"
            checked={anomalyOnly}
            onChange={(e) => setAnomalyOnly(e.target.checked)}
            className="rounded text-[#E83D6F] focus:ring-0 w-4 h-4"
          />
          <span className="text-xs font-bold text-amber-700 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Show Anomalies / Caveats Only</span>
          </span>
        </label>
      </div>

      {/* Main Data Table Container */}
      <div className="rounded-3xl bg-white border border-[#E8E8EC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          {activeBoard === 'deals' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] text-[#8E8E93] font-bold border-b border-[#E8E8EC] sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Deal Name</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Sector</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Probability</th>
                  <th className="p-3.5">Deal Value</th>
                  <th className="p-3.5">Weighted Value</th>
                  <th className="p-3.5">Tentative Close</th>
                  <th className="p-3.5">Owner</th>
                  <th className="p-3.5">Data Quality Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F6] text-[#48484A]">
                {filteredDeals.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F8FA] transition-colors">
                    <td className="p-3.5 font-bold text-[#1C1C1E]">{d.dealName}</td>
                    <td className="p-3.5 font-mono text-[#3B82F6] font-semibold">{d.clientCode}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F4F4F6] text-[#1C1C1E] text-[10px] font-bold">
                        {d.sector}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs truncate font-medium">{d.dealStage}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.closureProbabilityLabel === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        d.closureProbabilityLabel === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-[#F4F4F6] text-[#8E8E93]'
                      }`}>
                        {d.closureProbabilityLabel}
                      </span>
                    </td>
                    <td className="p-3.5 font-extrabold text-[#1C1C1E]">{formatCurrencyINR(d.dealValue)}</td>
                    <td className="p-3.5 text-[#E83D6F] font-bold">{formatCurrencyINR(d.weightedValue)}</td>
                    <td className="p-3.5 text-[#8E8E93]">{d.tentativeCloseDate || '-'}</td>
                    <td className="p-3.5 font-mono text-[#8E8E93]">{d.ownerCode}</td>
                    <td className="p-3.5">
                      {d.anomalies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {d.anomalies.map((ano, aIdx) => (
                            <span key={aIdx} className="px-2 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FEF3C7] text-[10px] text-amber-800 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{ano}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] text-[#8E8E93] font-bold border-b border-[#E8E8EC] sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Serial #</th>
                  <th className="p-3.5">Project / Deal</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Sector</th>
                  <th className="p-3.5">Execution Status</th>
                  <th className="p-3.5">Contract Value</th>
                  <th className="p-3.5">Invoiced</th>
                  <th className="p-3.5">Collected</th>
                  <th className="p-3.5">AR Outstanding</th>
                  <th className="p-3.5">Priority AR</th>
                  <th className="p-3.5">Data Quality Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F6] text-[#48484A]">
                {filteredWOs.map((wo) => (
                  <tr key={wo.id} className="hover:bg-[#F8F8FA] transition-colors">
                    <td className="p-3.5 font-mono text-[#E83D6F] font-bold">{wo.serialNo}</td>
                    <td className="p-3.5 font-bold text-[#1C1C1E]">{wo.dealName}</td>
                    <td className="p-3.5 font-mono text-[#3B82F6] font-semibold">{wo.clientCode}</td>
                    <td className="p-3.5">{wo.sector}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        wo.executionStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        wo.executionStatus.includes('Ongoing') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {wo.executionStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-extrabold text-[#1C1C1E]">{formatCurrencyINR(wo.amountInclGst)}</td>
                    <td className="p-3.5 text-[#3B82F6] font-bold">{formatCurrencyINR(wo.billedInclGst)}</td>
                    <td className="p-3.5 text-emerald-600 font-bold">{formatCurrencyINR(wo.collectedInclGst)}</td>
                    <td className="p-3.5 font-extrabold text-[#E83D6F]">{formatCurrencyINR(wo.arReceivable)}</td>
                    <td className="p-3.5">
                      {wo.isPriorityAR ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA] text-[10px] font-bold">
                          PRIORITY
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] text-[10px] font-medium">Standard</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {wo.anomalies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wo.anomalies.map((ano, aIdx) => (
                            <span key={aIdx} className="px-2 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FEF3C7] text-[10px] text-amber-800 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{ano}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 bg-[#F8F8FA] border-t border-[#E8E8EC] text-xs font-semibold text-[#8E8E93] flex items-center justify-between">
          <span>Showing {activeBoard === 'deals' ? filteredDeals.length : filteredWOs.length} records</span>
          <span>All records sanitized & synchronized</span>
        </div>
      </div>
    </div>

  );
};
