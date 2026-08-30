import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  CheckSquare, 
  TrendingUp, 
  Share2, 
  Printer,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Deal, WorkOrder, LeadershipUpdateReport } from '../types';
import { generateLeadershipReport, formatLeadershipUpdateAsMarkdown, formatLeadershipUpdateForSlack } from '../services/leadershipService';

interface LeadershipStudioProps {
  deals: Deal[];
  workOrders: WorkOrder[];
}

export const LeadershipStudio: React.FC<LeadershipStudioProps> = ({ deals, workOrders }) => {
  const [period, setPeriod] = useState<string>('Q4 FY25-26 (Current Quarter)');
  const [copiedType, setCopiedType] = useState<'md' | 'slack' | null>(null);

  const report: LeadershipUpdateReport = generateLeadershipReport(deals, workOrders, period);

  const handleCopyMarkdown = () => {
    const md = formatLeadershipUpdateAsMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopiedType('md');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopySlack = () => {
    const slack = formatLeadershipUpdateForSlack(report);
    navigator.clipboard.writeText(slack);
    setCopiedType('slack');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const md = formatLeadershipUpdateAsMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skylark_Executive_Briefing_${period.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-[#1C1C1E]">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8EC] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA]">
              Leadership Briefing Studio
            </span>
            <span className="text-xs text-[#8E8E93]">Board & Executive Ready</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight mt-1">
            Executive Business Intelligence Update
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-[#E8E8EC] px-3 py-1.5 rounded-full text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Select Reporting Period"
              className="bg-transparent text-[#1C1C1E] font-bold outline-none cursor-pointer"
            >
              <option value="Q4 FY25-26 (Current Quarter)">Q4 FY25-26 (Current Quarter)</option>
              <option value="Monthly Executive Review — Feb 2026">Monthly Review — Feb 2026</option>
              <option value="Annual Operating Plan Tracking FY25-26">Annual Plan Tracking FY25-26</option>
            </select>
          </div>

          <button
            onClick={handleCopySlack}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF5F7] border border-[#E8E8EC] text-xs font-bold text-[#E83D6F] flex items-center space-x-1.5 shadow-sm transition-all"
            title="Copy Slack snippet formatted for executive channels"
          >
            {copiedType === 'slack' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied Slack</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy for Slack</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E8E8EC] text-xs font-bold text-[#48484A] flex items-center space-x-1.5 shadow-sm transition-all"
            title="Copy as Markdown document"
          >
            {copiedType === 'md' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied MD</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy MD</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-4 py-1.5 rounded-full bg-[#E83D6F] hover:bg-[#D92A5E] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Structured Executive Document Container */}
      <div className="rounded-3xl bg-white border border-[#E8E8EC] p-6 sm:p-8 shadow-sm space-y-8 text-[#1C1C1E]">
        {/* Document Header */}
        <div className="border-b border-[#F4F4F6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">{report.title}</h2>
            <div className="text-xs text-[#8E8E93] mt-0.5 font-medium">
              Period: <strong className="text-[#E83D6F] font-bold">{report.period}</strong> | Generated: {report.date}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Live Monday.com Data
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-5 rounded-2xl bg-[#FFF5F7] border border-[#FCE7EA] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#E83D6F] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#E83D6F]" />
            <span>Executive TL;DR</span>
          </div>
          <p className="text-sm text-[#48484A] leading-relaxed font-normal">
            {report.executiveSummary}
          </p>
        </div>

        {/* Scorecard Cards */}
        <div>
          <div className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2.5">
            Quarterly Operating Scorecard
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2]">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Sales Pipeline Health</div>
              <div className="text-sm font-extrabold text-[#1C1C1E] mt-1">{report.scorecard.pipelineHealth}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2]">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Revenue Realization</div>
              <div className="text-sm font-extrabold text-emerald-600 mt-1">{report.scorecard.revenueRealization}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2]">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Operational SLA Velocity</div>
              <div className="text-sm font-extrabold text-[#3B82F6] mt-1">{report.scorecard.operationalVelocity}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2]">
              <div className="text-[11px] font-semibold text-[#8E8E93]">Working Capital Risk</div>
              <div className="text-sm font-extrabold text-[#E83D6F] mt-1">{report.scorecard.cashRisk}</div>
            </div>
          </div>
        </div>

        {/* Report Sections */}
        {report.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <h3 className="text-base font-bold text-[#1C1C1E] border-b border-[#F4F4F6] pb-2">
              {section.heading}
            </h3>

            {/* Metric Chips */}
            {section.metrics && section.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {section.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="p-3 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2] text-xs">
                    <div className="text-[#8E8E93] text-[11px] font-medium">{m.label}</div>
                    <div className="font-extrabold text-[#1C1C1E] mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bullets */}
            <ul className="space-y-1.5 text-xs text-[#48484A]">
              {section.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start space-x-2">
                  <span className="text-[#E83D6F] mt-0.5 font-bold">•</span>
                  <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1C1C1E] font-bold">$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* High Priority Strategic Risks Matrix */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#1C1C1E] border-b border-[#F4F4F6] pb-2 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#E83D6F]" />
            <span>High-Priority Risks & Operational Mitigations</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-[#E8E8EC] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] text-[#8E8E93] font-bold border-b border-[#E8E8EC]">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Identified Risk</th>
                  <th className="p-3">Business Impact</th>
                  <th className="p-3">Mitigation Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F6] text-[#48484A]">
                {report.highPriorityRisks.map((risk, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F8F8FA]">
                    <td className="p-3 font-bold text-[#E83D6F]">{risk.category}</td>
                    <td className="p-3 font-medium">{risk.item}</td>
                    <td className="p-3 text-amber-700 font-medium">{risk.impact}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{risk.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items for Exec Team */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#1C1C1E] border-b border-[#F4F4F6] pb-2 flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-[#E83D6F]" />
            <span>Strategic Action Items & Follow-ups</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-[#E8E8EC] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] text-[#8E8E93] font-bold border-b border-[#E8E8EC]">
                <tr>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Strategic Task</th>
                  <th className="p-3">Timeline</th>
                  <th className="p-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F6] text-[#48484A]">
                {report.actionItems.map((action, aIdx) => (
                  <tr key={aIdx} className="hover:bg-[#F8F8FA]">
                    <td className="p-3 font-bold text-[#1C1C1E]">{action.owner}</td>
                    <td className="p-3 font-medium">{action.task}</td>
                    <td className="p-3 text-[#8E8E93] font-medium">{action.deadline}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        action.priority === 'HIGH' ? 'bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA]' : 'bg-[#FFFBEB] text-amber-700 border border-[#FEF3C7]'
                      }`}>
                        {action.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  );
};
