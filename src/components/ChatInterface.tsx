import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  Copy, 
  Check, 
  Table, 
  HelpCircle,
  BarChart2,
  PieChart as PieIcon,
  Layers
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
  Cell,
} from 'recharts';
import { Deal, WorkOrder, QueryResult } from '../types';
import { processFounderQuery } from '../services/queryEngine';
import { MarkdownText } from './MarkdownText';
import { formatCurrencyINR } from '../services/dataResilience';

interface ChatInterfaceProps {
  deals: Deal[];
  workOrders: WorkOrder[];
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  result?: QueryResult;
  isLoading?: boolean;
}

const PRESET_QUERIES = [
  "How's our pipeline looking for energy sector this quarter?",
  "What is our total outstanding AR and priority risk accounts?",
  "Show operational delivery turnaround and execution delays in Mining",
  "Prepare an Executive Leadership Briefing for next week's board meeting",
  "Compare deals won vs operational work orders billed",
  "Which sales owners are driving the highest pipeline vs highest AR risk?",
  "Show me deals closing in the next 30 days",
];

const COLORS = ['#E83D6F', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ deals, workOrders, initialQuery }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello Founder! I am your **Skylark Drones Business Intelligence Agent**. I continuously monitor your **Sales Pipeline (${deals.length} Deals)** and **Project Execution (${workOrders.length} Work Orders)** across Monday.com.

Ask me any business question — revenue forecasts, sectoral pipeline health, delivery velocity, cash collection risks, or generate an executive leadership briefing.`,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDrilldown, setShowDrilldown] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSend = async (queryText?: string) => {
    const textToSubmit = queryText || inputQuery;
    if (!textToSubmit.trim() || isProcessing) return;

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: textToSubmit,
      },
      {
        id: assistantMsgId,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true,
      },
    ]);

    setInputQuery('');
    setIsProcessing(true);

    try {
      const result = await processFounderQuery(textToSubmit, deals, workOrders);
      
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isLoading: false, result } : msg
          )
        );
        setIsProcessing(false);
      }, 400);
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                isLoading: false,
                text: 'Sorry, I encountered an issue analyzing the Monday.com board data. Please try again.',
              }
            : msg
        )
      );
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-0 text-[#1C1C1E]">
      {/* Quick Prompt Suggestions Bar */}
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#8E8E93] mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E83D6F]" />
          <span>Founder Quick Inquiries</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isProcessing}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF5F7] border border-[#E8E8EC] hover:border-[#E83D6F] text-[#48484A] hover:text-[#E83D6F] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <span>{q}</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container — only this div scrolls */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 min-h-0 pb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#131316] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-[#E83D6F]" />
              </div>
            )}

            {/* Message Bubble Content */}
            <div
              className={`max-w-3xl rounded-3xl p-5 sm:p-6 transition-all ${
                msg.sender === 'user'
                  ? 'bg-[#131316] text-white shadow-md ml-12'
                  : 'bg-white border border-[#E8E8EC] text-[#1C1C1E] shadow-sm w-full'
              }`}
            >
              {msg.sender === 'user' ? (
                <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
              ) : msg.isLoading ? (
                <div className="flex items-center space-x-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-[#E83D6F] animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping delay-100" />
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping delay-200" />
                  <span className="text-xs text-[#8E8E93] font-semibold">
                    Querying Deals & Work Orders boards...
                  </span>
                </div>
              ) : msg.result ? (
                <div className="space-y-5">
                  {/* Top Badge & Confidence Score */}
                  <div className="flex items-center justify-between border-b border-[#F4F4F6] pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA]">
                        BI Intelligence Verified
                      </span>
                      <span className="text-xs text-[#8E8E93]">
                        Confidence: <strong className="text-emerald-600 font-bold">{msg.result.confidenceScore}%</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(msg.result?.summary || '', msg.id)}
                      className="p-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] text-xs flex items-center space-x-1 font-semibold"
                      title="Copy response summary"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>


                  {/* Executive Summary */}
                  <div className="leading-relaxed font-normal">
                    <MarkdownText text={msg.result.summary} />
                  </div>

                  {/* KPI Metric Scorecards */}
                  {msg.result.keyMetrics && msg.result.keyMetrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {msg.result.keyMetrics.map((kpi, kIdx) => (
                        <div
                          key={kIdx}
                          className="p-3.5 rounded-2xl bg-[#F8F8FA] border border-[#EDEDF2]"
                        >
                          <div className="text-[11px] font-semibold text-[#8E8E93] truncate">
                            {kpi.label}
                          </div>
                          <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] tracking-tight mt-0.5">
                            {kpi.value}
                          </div>
                          {kpi.subtext && (
                            <div className="text-[10px] text-[#8E8E93] mt-0.5 truncate font-medium">
                              {kpi.subtext}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Visual Chart */}
                  {msg.result.chartConfig && msg.result.chartConfig.data.length > 0 && (
                    <div className="p-5 rounded-3xl bg-[#F8F8FA] border border-[#EDEDF2]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#1C1C1E]">
                          <BarChart2 className="w-4 h-4 text-[#E83D6F]" />
                          <span>{msg.result.chartConfig.title}</span>
                        </div>
                      </div>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={msg.result.chartConfig.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF2" vertical={false} />
                            <XAxis
                              dataKey={msg.result.chartConfig.xAxisKey || 'name'}
                              stroke="#8E8E93"
                              fontSize={11}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#8E8E93"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(v) => formatCurrencyINR(v, { compact: true, showSymbol: false })}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1C1C1E',
                                borderRadius: '12px',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                border: 'none',
                              }}
                              formatter={(value: any) => [
                                typeof value === 'number' ? formatCurrencyINR(value) : value,
                                'Amount',
                              ]}
                            />
                            {msg.result.chartConfig.dataKeys.map((dk, dIdx) => (
                              <Bar key={dIdx} dataKey={dk.key} name={dk.name} radius={[6, 6, 0, 0]}>
                                {msg.result?.chartConfig?.data.map((_, idx) => (
                                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Bar>
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Key Narrative Bullets */}
                  {msg.result.narrativeBullets && msg.result.narrativeBullets.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
                        Operational & Sales Breakdown
                      </div>
                      <ul className="space-y-1 text-xs text-[#48484A]">
                        {msg.result.narrativeBullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start space-x-2">
                            <span className="text-[#E83D6F] mt-0.5 font-bold">•</span>
                            <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#1C1C1E] font-bold">$1</strong>') }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategic Insights */}
                  {msg.result.strategicInsights && msg.result.strategicInsights.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE7EA] space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#E83D6F]">
                        <TrendingUp className="w-3.5 h-3.5 text-[#E83D6F]" />
                        <span>Founder Actionable Takeaways</span>
                      </div>
                      <ul className="space-y-1 text-xs text-[#48484A]">
                        {msg.result.strategicInsights.map((insight, iIdx) => (
                          <li key={iIdx} className="flex items-start space-x-2">
                            <span className="text-[#E83D6F] font-bold">→</span>
                            <span className="font-medium">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data Quality Caveats */}
                  {msg.result.dataQualityCaveats && msg.result.dataQualityCaveats.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] flex items-start space-x-2 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-900">Data Resilience Caveat:</strong>{' '}
                        {msg.result.dataQualityCaveats.join(' ')}
                      </div>
                    </div>
                  )}

                  {/* Clarification Prompt Options (if query was ambiguous) */}
                  {msg.result.clarificationPrompt && (
                    <div className="p-4 rounded-2xl bg-[#F5F3FF] border border-[#EDE9FE] space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-900">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                        <span>{msg.result.clarificationPrompt.question}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {msg.result.clarificationPrompt.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleSend(opt)}
                            className="p-3 rounded-xl bg-white hover:bg-[#F3E8FF] border border-[#E9D5FF] text-left text-xs font-semibold text-[#1C1C1E] transition-all flex items-center justify-between shadow-sm"
                          >
                            <span>{opt}</span>
                            <ChevronRight className="w-3 h-3 text-purple-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drilldown Data Toggle */}
                  {msg.result.drilldownData && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowDrilldown(showDrilldown === msg.id ? null : msg.id)}
                        className="text-xs font-bold text-[#E83D6F] hover:underline flex items-center space-x-1.5"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>
                          {showDrilldown === msg.id ? 'Hide Drilldown Records' : `View ${msg.result.drilldownData.rows.length} Drilldown Records`}
                        </span>
                      </button>

                      {showDrilldown === msg.id && (
                        <div className="mt-3 overflow-x-auto max-h-60 rounded-2xl border border-[#E8E8EC] custom-scrollbar bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#F8F8FA] text-[#8E8E93] font-bold sticky top-0 border-b border-[#E8E8EC]">
                              <tr>
                                {msg.result.drilldownData.columns.map((col) => (
                                  <th key={col.key} className="p-3 whitespace-nowrap">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F4F6] text-[#48484A]">
                              {msg.result.drilldownData.rows.map((row: any, rIdx: number) => (
                                <tr key={rIdx} className="hover:bg-[#F8F8FA]">
                                  {msg.result?.drilldownData?.columns.map((col) => (
                                    <td key={col.key} className="p-3 whitespace-nowrap">
                                      {col.format === 'currency'
                                        ? formatCurrencyINR(row[col.key])
                                        : col.format === 'badge'
                                        ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5F7] text-[#E83D6F] border border-[#FCE7EA]">
                                            {row[col.key]}
                                          </span>
                                        )
                                        : row[col.key] || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Next Inquiries */}
                  {msg.result.suggestedFollowups && msg.result.suggestedFollowups.length > 0 && (
                    <div className="pt-3 border-t border-[#F4F4F6] flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[#8E8E93] font-semibold">Suggested Next Steps:</span>
                      {msg.result.suggestedFollowups.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sug)}
                          className="text-[11px] px-3 py-1 rounded-full bg-[#F4F4F6] hover:bg-[#FFF5F7] text-[#48484A] hover:text-[#E83D6F] font-semibold transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="leading-relaxed">
                  <MarkdownText text={msg.text || ''} />
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box — pinned at bottom, never scrolls */}
      <div className="flex-shrink-0 pt-3 pb-4 border-t border-[#E8E8EC] bg-[#FAFAFC]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a founder-level query (e.g. 'Pipeline in energy Q4', 'Top AR risk accounts', 'Delayed projects in Mining')..."
            className="w-full pl-5 pr-24 py-3.5 rounded-full bg-white border border-[#E8E8EC] focus:border-[#E83D6F] text-xs text-[#1C1C1E] placeholder-[#8E8E93] transition-all outline-none shadow-sm"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="absolute right-2 px-4 py-2 rounded-full bg-[#E83D6F] hover:bg-[#D92A5E] text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-40 transition-all shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-[#8E8E93]">
          <span>Connected to Monday.com: Deals Funnel Tracker & Work Order Fulfillment</span>
          <span>Zero hallucination calculation engine</span>
        </div>
      </div>
    </div>
  );
};

