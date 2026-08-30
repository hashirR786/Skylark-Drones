import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Users, 
  Filter,
  BarChart3,
  SlidersHorizontal,
  Download,
  Share2,
  ChevronDown,
  Star,
  Plus,
  ArrowUpRight,
  Flame,
  Award,
  Zap,
  Globe,
  Compass,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { Deal, WorkOrder, CrossBoardMetrics, SectorAnalytics } from '../types';
import { formatCurrencyINR, computeSectorBreakdown, computeOwnerPerformance } from '../services/dataResilience';

interface AnalyticsDashboardProps {
  deals: Deal[];
  workOrders: WorkOrder[];
  metrics: CrossBoardMetrics;
}

const SECTOR_ICONS: Record<string, { bg: string; color: string; label: string }> = {
  'Mining': { bg: '#FFF0F5', color: '#E83D6F', label: 'Mining' },
  'Renewables': { bg: '#FFF7ED', color: '#F97316', label: 'Renewables' },
  'Powerline': { bg: '#EFF6FF', color: '#3B82F6', label: 'Powerline' },
  'Railways': { bg: '#F5F3FF', color: '#8B5CF6', label: 'Railways' },
  'Tender': { bg: '#ECFDF5', color: '#10B981', label: 'Tender' },
  'DSP': { bg: '#FEF3C7', color: '#F59E0B', label: 'DSP' },
  'Security & Surveillance': { bg: '#FDF2F8', color: '#EC4899', label: 'Security' },
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  deals,
  workOrders,
  metrics,
}) => {
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<string>('Q4 FY25-26');
  const [valueToggle, setValueToggle] = useState<'revenue' | 'leads' | 'wl'>('revenue');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const sectorData = computeSectorBreakdown(deals, workOrders);
  const ownerData = computeOwnerPerformance(deals, workOrders);

  const totalRevFormatted = formatCurrencyINR(metrics.totalPipelineValue);
  const wonRevFormatted = formatCurrencyINR(metrics.totalWonDealsValue);

  // Dynamic Sales dynamic curve data
  const dynamicCurveData = [
    { week: 'W1', value: 32000, target: 28000 },
    { week: 'W2', value: 45000, target: 35000 },
    { week: 'W3', value: 38000, target: 40000 },
    { week: 'W4', value: 58000, target: 42000 },
    { week: 'W5', value: 51000, target: 48000 },
    { week: 'W6', value: 67000, target: 50000 },
    { week: 'W7', value: 62000, target: 54000 },
    { week: 'W8', value: 78000, target: 59000 },
    { week: 'W9', value: 71000, target: 63000 },
    { week: 'W10', value: 89000, target: 68000 },
    { week: 'W11', value: 95000, target: 72000 },
  ];

  // Monthly breakdown data for lower left card
  const monthlyBarData = [
    { month: 'Sep', revenue: 6901, leads: 110, wl: 42, label: '₹6.9 L' },
    { month: 'Oct', revenue: 11035, leads: 165, wl: 68, label: '₹11.0 L' },
    { month: 'Nov', revenue: 8288, leads: 135, wl: 54, label: '₹8.3 L' },
    { month: 'Dec', revenue: 14500, leads: 190, wl: 82, label: '₹14.5 L' },
    { month: 'Jan', revenue: 12400, leads: 175, wl: 76, label: '₹12.4 L' },
  ];

  const topOwners = ownerData.slice(0, 4);
  const totalOwnerPipeline = topOwners.reduce((a, b) => a + b.openPipeline, 0) || 1;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto text-[#1C1C1E] bg-[#FAFAFC]">
      {/* Top Controls Row: Sales Rep Avatars + Action Icons + Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar Team Chips */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setSelectedOwner('ALL')}
            className="w-8 h-8 rounded-full border border-dashed border-[#D4D4D8] hover:border-[#1C1C1E] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors text-xs"
            title="All Owners"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Armin (OWNER_001) */}
          <button
            onClick={() => setSelectedOwner(selectedOwner === 'OWNER_001' ? 'ALL' : 'OWNER_001')}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              selectedOwner === 'OWNER_001'
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                : 'bg-white text-[#1C1C1E] border-[#E8E8EC] hover:bg-[#F5F5F7]'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
              A
            </div>
            <span>Armin A.</span>
          </button>

          {/* Eren (OWNER_002) */}
          <button
            onClick={() => setSelectedOwner(selectedOwner === 'OWNER_002' ? 'ALL' : 'OWNER_002')}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              selectedOwner === 'OWNER_002'
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                : 'bg-white text-[#1C1C1E] border-[#E8E8EC] hover:bg-[#F5F5F7]'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
              E
            </div>
            <span>Eren Y.</span>
          </button>

          {/* Mikasa (OWNER_003) */}
          <button
            onClick={() => setSelectedOwner(selectedOwner === 'OWNER_003' ? 'ALL' : 'OWNER_003')}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              selectedOwner === 'OWNER_003'
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                : 'bg-white text-[#1C1C1E] border-[#E8E8EC] hover:bg-[#F5F5F7]'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
              M
            </div>
            <span>Mikasa A.</span>
          </button>

          {/* All Chip */}
          <button
            onClick={() => setSelectedOwner('ALL')}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              selectedOwner === 'ALL'
                ? 'bg-[#1C1C1E] text-white'
                : 'bg-[#EAEAEA] text-[#6E6E73] hover:bg-[#D4D4D8]'
            }`}
            title="View All Sales Reps"
          >
            C
          </button>
        </div>

        {/* Right: Sliders, Download, Share, Timeframe */}
        <div className="flex items-center space-x-2.5">
          <button 
            className="w-8 h-8 rounded-full bg-white border border-[#E8E8EC] flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] shadow-sm transition-all"
            title="Configure Metrics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => window.print()}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E8EC] flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] shadow-sm transition-all"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button 
            className="w-8 h-8 rounded-full bg-white border border-[#E8E8EC] flex items-center justify-center text-[#6E6E73] hover:text-[#1C1C1E] shadow-sm transition-all"
            title="Share Dashboard"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Timeframe Switcher Pill */}
          <div className="flex items-center space-x-2 bg-white border border-[#E8E8EC] px-3 py-1.5 rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#1C1C1E]" />
            <span className="text-[11px] font-semibold text-[#8E8E93]">Timeframe</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1C1C1E] outline-none cursor-pointer"
            >
              <option value="Q4 FY25-26">Sep 1 - Nov 30, 2025</option>
              <option value="Q3 FY25-26">Jun 1 - Aug 31, 2025</option>
              <option value="Annual FY25-26">Annual Operating Plan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hero Big Revenue Banner + Stat Cards */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight">
            New report
          </h1>
        </div>

        {/* Revenue Metric Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Huge Number */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
              Revenue
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#1C1C1E] tracking-tight">
                {totalRevFormatted}
              </span>
              
              {/* Pink Pill Badge */}
              <span className="px-2.5 py-1 rounded-full bg-[#E83D6F] text-white text-xs font-extrabold flex items-center space-x-1 shadow-sm">
                <span>★ 7.9%</span>
              </span>

              {/* Secondary Metric Pill */}
              <span className="px-2.5 py-1 rounded-full bg-[#801B3A] text-white text-xs font-bold">
                ₹27,335.09
              </span>
            </div>

            <div className="text-xs text-[#8E8E93] flex items-center space-x-1 pt-0.5">
              <span>vs prev. ₹50.16 Cr Jun 1 - Aug 31, 2025</span>
              <ChevronDown className="w-3 h-3 text-[#8E8E93]" />
            </div>
          </div>

          {/* 5 Quick KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1 max-w-2xl">
            {/* Card 1: Top sales */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E8EC] shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Top sales</div>
              <div className="text-xl font-extrabold text-[#1C1C1E] mt-1">72</div>
              <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold text-[#1C1C1E]">
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">M</div>
                <span>Mikasa</span>
                <span className="text-[#8E8E93]">&gt;</span>
              </div>
            </div>

            {/* Card 2: Best deal (Pitch Black Dark Card with Star) */}
            <div className="p-3.5 rounded-2xl bg-[#131316] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
              <Star className="w-3.5 h-3.5 text-amber-400 absolute top-3.5 right-3.5 fill-amber-400" />
              <div className="text-[11px] font-medium text-[#8E8E93]">Best deal</div>
              <div className="text-lg font-extrabold text-white mt-1">₹4.23 Cr</div>
              <div className="text-[10px] text-[#A1A1AA] mt-2 truncate font-medium">
                Rolf Mining Inc.
              </div>
            </div>

            {/* Card 3: Deals */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E8EC] shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Deals</div>
              <div className="text-xl font-extrabold text-[#1C1C1E] mt-1">{deals.length}</div>
              <div className="text-[10px] font-bold text-[#1C1C1E] flex items-center space-x-0.5 mt-2">
                <span>&#8593; 5</span>
              </div>
            </div>

            {/* Card 4: Value (Rose Pink Highlight Card) */}
            <div className="p-3.5 rounded-2xl bg-[#FFF5F7] border border-[#E83D6F] shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-[#E83D6F]">Value</div>
              <div className="text-xl font-extrabold text-[#E83D6F] mt-1">₹68.8Cr</div>
              <div className="text-[10px] font-bold text-[#E83D6F] flex items-center space-x-0.5 mt-2">
                <span>&#8593; 7.9%</span>
              </div>
            </div>

            {/* Card 5: Win rate */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E8EC] shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Win rate</div>
              <div className="text-xl font-extrabold text-[#1C1C1E] mt-1">{metrics.winRatePercent}%</div>
              <div className="text-[10px] font-bold text-emerald-600 flex items-center space-x-0.5 mt-2">
                <span>&#8593; 1.2%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Segmented Progress Bar (Team Revenue Contribution) */}
        <div className="p-3 rounded-2xl bg-white border border-[#E8E8EC] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            {/* Armin */}
            <div className="flex items-center space-x-2 font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">A</div>
              <span className="font-bold text-[#1C1C1E]">₹2,09,633</span>
              <span className="text-[#8E8E93]">39.63%</span>
            </div>

            {/* Mikasa */}
            <div className="flex items-center space-x-2 font-medium">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">M</div>
              <span className="font-bold text-[#1C1C1E]">₹1,56,841</span>
              <span className="text-[#8E8E93]">29.65%</span>
            </div>

            {/* Eren */}
            <div className="flex items-center space-x-2 font-medium">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">E</div>
              <span className="font-bold text-[#1C1C1E]">₹1,17,115</span>
              <span className="text-[#8E8E93]">22.14%</span>
            </div>

            {/* Others */}
            <div className="flex items-center space-x-2 font-medium">
              <div className="w-5 h-5 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center text-[10px] font-bold">C</div>
              <span className="font-bold text-[#1C1C1E]">₹45,386</span>
              <span className="text-[#8E8E93]">8.58%</span>
            </div>
          </div>

          <button 
            onClick={() => setSelectedOwner('ALL')}
            className="px-5 py-2 rounded-full bg-[#131316] text-white text-xs font-bold hover:bg-[#2A2A30] transition-colors"
          >
            Details
          </button>
        </div>
      </div>

      {/* Middle & Lower Multi-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Row 1: Sector Breakdown List & Vertical Pill Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Sector List Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E8E8EC] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#1C1C1E]">
                  <Layers className="w-4 h-4 text-[#8E8E93]" />
                  <span>Sectors by Revenue</span>
                </div>
                <button className="flex items-center space-x-1 text-[11px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E]">
                  <span>Filters</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {sectorData.slice(0, 4).map((s, idx) => {
                  const percent = Math.round((s.pipelineValue / (metrics.totalPipelineValue || 1)) * 100);
                  const iconStyle = SECTOR_ICONS[s.sector] || { bg: '#F4F4F6', color: '#1C1C1E', label: s.sector };
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: iconStyle.bg, color: iconStyle.color }}
                        >
                          {s.sector.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#1C1C1E]">{s.sector}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#1C1C1E]">{formatCurrencyINR(s.pipelineValue)}</span>
                        <span className="text-[#8E8E93] w-7 text-right font-medium">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Pill Bar Chart Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E8E8EC] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#1C1C1E]">
                  <BarChart3 className="w-4 h-4 text-[#8E8E93]" />
                  <span>Deals by Category</span>
                </div>
                <button className="flex items-center space-x-1 text-[11px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E]">
                  <span>Filters</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Vertical Capsule Pill Bars */}
              <div className="flex items-end justify-between px-2 pt-4 h-40">
                {sectorData.slice(0, 4).map((s, idx) => {
                  const heights = ['h-28', 'h-20', 'h-36', 'h-16'];
                  const iconStyle = SECTOR_ICONS[s.sector] || { bg: '#F4F4F6', color: '#1C1C1E' };
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm"
                        style={{ backgroundColor: iconStyle.bg, color: iconStyle.color }}
                      >
                        {s.sector.slice(0, 1)}
                      </div>
                      <div className="w-10 bg-[#F4F4F6] rounded-full p-1 flex flex-col justify-end h-32">
                        <div 
                          className={`w-full ${heights[idx % heights.length]} rounded-full transition-all`}
                          style={{ backgroundColor: idx === 2 ? '#E83D6F' : '#E0E0E6' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-[#8E8E93] text-center font-medium">
                Deals amount by referrer category
              </div>
            </div>
          </div>

          {/* Row 2: Platform / Sector Value Deep-Dive with Pink Highlight Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E8EC] shadow-sm space-y-5">
            {/* Header with Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFF0F5] text-[#E83D6F] flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1C1E]">Platform value: Mining & Energy</div>
                </div>
              </div>

              {/* Segmented Button: Revenue | Leads | W/L */}
              <div className="flex items-center bg-[#F4F4F6] p-1 rounded-full">
                <button
                  onClick={() => setValueToggle('revenue')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    valueToggle === 'revenue' ? 'bg-[#131316] text-white shadow-sm' : 'text-[#6E6E73] hover:text-[#1C1C1E]'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setValueToggle('leads')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    valueToggle === 'leads' ? 'bg-[#131316] text-white shadow-sm' : 'text-[#6E6E73] hover:text-[#1C1C1E]'
                  }`}
                >
                  Leads
                </button>
                <button
                  onClick={() => setValueToggle('wl')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    valueToggle === 'wl' ? 'bg-[#131316] text-white shadow-sm' : 'text-[#6E6E73] hover:text-[#1C1C1E]'
                  }`}
                >
                  W/L
                </button>
              </div>
            </div>

            {/* Inner Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Pink Highlight Card */}
              <div className="sm:col-span-4 p-4 rounded-2xl bg-gradient-to-br from-[#E83D6F] to-[#D92A5E] text-white shadow-md space-y-3">
                <div className="text-[11px] font-semibold text-rose-100 uppercase tracking-wider">
                  Average monthly
                </div>
                <div>
                  <div className="text-[10px] text-rose-100 font-medium">Revenue</div>
                  <div className="text-lg font-extrabold text-white">₹18,552</div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-100 font-medium">Leads</div>
                  <div className="text-xs font-bold text-white">373 <span className="text-[10px] font-normal text-rose-200">97/276</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-100 font-medium">Win/lose</div>
                  <div className="text-xs font-bold text-white">16% <span className="text-[10px] font-normal text-rose-200">51/318</span></div>
                </div>
              </div>

              {/* Monthly Bar Chart */}
              <div className="sm:col-span-8 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" vertical={false} />
                    <XAxis dataKey="month" stroke="#8E8E93" fontSize={10} tickLine={false} />
                    <YAxis stroke="#8E8E93" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                      formatter={(v: any) => [`₹${v}`, 'Value']}
                    />
                    <Bar dataKey={valueToggle === 'revenue' ? 'revenue' : valueToggle === 'leads' ? 'leads' : 'wl'} radius={[6, 6, 0, 0]}>
                      {monthlyBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? '#E83D6F' : '#E8E8EC'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sales Leaderboard Table Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E8EC] shadow-sm space-y-4">
            {/* Table Header */}
            <div className="flex items-center justify-between text-xs font-bold text-[#8E8E93] pb-2 border-b border-[#F4F4F6]">
              <span>Sales</span>
              <span>Revenue</span>
              <span>Leads</span>
              <span>KPI</span>
              <span>W/L</span>
            </div>

            {/* Rep Rows */}
            <div className="space-y-3">
              {/* Row 1: Armin */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-bold text-[#1C1C1E]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">A</div>
                  <span>Armin A.</span>
                </div>
                <span className="font-bold text-[#1C1C1E]">₹209,633</span>
                <div className="flex items-center space-x-1 font-bold">
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px]">41</span>
                  <span className="text-[#8E8E93] text-[10px]">118</span>
                </div>
                <span className="font-semibold text-[#1C1C1E]">0.84</span>
                <div className="flex items-center space-x-1 font-semibold text-[11px]">
                  <span>31%</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[9px]">12</span>
                  <span className="text-[#8E8E93] text-[9px]">29</span>
                </div>
              </div>

              {/* Row 2: Mikasa */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-bold text-[#1C1C1E]">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">M</div>
                  <span>Mikasa A.</span>
                </div>
                <span className="font-bold text-[#1C1C1E]">₹156,841</span>
                <div className="flex items-center space-x-1 font-bold">
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px]">54</span>
                  <span className="text-[#8E8E93] text-[10px]">103</span>
                </div>
                <span className="font-semibold text-[#1C1C1E]">0.89</span>
                <div className="flex items-center space-x-1 font-semibold text-[11px]">
                  <span>39%</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[9px]">21</span>
                  <span className="text-[#8E8E93] text-[9px]">33</span>
                </div>
              </div>
            </div>

            {/* Achievement Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FFF5F7] border border-[#FCE7EA] text-[#E83D6F] text-[11px] font-bold flex items-center space-x-1">
                <span>Top sales 🔥</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-amber-700 text-[11px] font-bold flex items-center space-x-1">
                <span>Sales streak 🔥</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F5F3FF] border border-[#EDE9FE] text-purple-700 text-[11px] font-bold flex items-center space-x-1">
                <span>Top review 🔥</span>
              </span>
            </div>
          </div>

          {/* Work with Platforms / Sectors & Sales Dynamic Area Chart */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E8EC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#1C1C1E]">
                Work with platforms
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-extrabold text-[#E83D6F]">
                <span className="w-4 h-4 rounded-full bg-[#FFF0F5] flex items-center justify-center text-[9px]">★</span>
                <span>₹156,841</span>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-[#F8F8FA] flex items-center justify-between">
                <span className="font-semibold text-[#1C1C1E]">Mining</span>
                <span className="text-[#8E8E93]">28.1%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F8F8FA] flex items-center justify-between">
                <span className="font-semibold text-[#1C1C1E]">Renewables</span>
                <span className="text-[#8E8E93]">14.1%</span>
              </div>
            </div>

            {/* Big Headline Share */}
            <div className="pt-1">
              <div className="text-2xl font-extrabold text-[#1C1C1E]">
                45.3% <span className="text-base text-[#8E8E93] font-semibold">₹71,048</span>
              </div>
            </div>

            {/* Sales Dynamic Area Chart */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1C1C1E]">
                <span>Sales dynamic</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8E8E93]" />
              </div>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicCurveData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E83D6F" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#E83D6F" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F6" vertical={false} />
                    <XAxis dataKey="week" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                    <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                      formatter={(v: any) => [`₹${v}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#E83D6F" strokeWidth={2.5} fillOpacity={1} fill="url(#roseGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Eren row */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F4F4F6]">
              <div className="flex items-center space-x-2 font-bold text-[#1C1C1E]">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">E</div>
                <span>Eren Y.</span>
              </div>
              <span className="font-bold text-[#1C1C1E]">₹117,115</span>
              <div className="flex items-center space-x-1 font-bold">
                <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px]">22</span>
                <span className="text-[#8E8E93] text-[10px]">84</span>
              </div>
              <span className="font-semibold text-[#1C1C1E]">0.79</span>
              <div className="flex items-center space-x-1 font-semibold text-[11px]">
                <span>32%</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[9px]">7</span>
                <span className="text-[#8E8E93] text-[9px]">15</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

