export interface Deal {
  id: string;
  dealName: string;
  ownerCode: string;
  clientCode: string;
  dealStatus: 'Won' | 'Dead' | 'Open' | 'On Hold';
  dealStage: string;
  closureProbabilityLabel: 'High' | 'Medium' | 'Low' | 'Won' | 'Lost' | 'Medium-Low';
  closureProbabilityPercent: number;
  dealValue: number;
  weightedValue: number;
  closeDate: string;
  tentativeCloseDate: string;
  createdDate: string;
  productDeal: string;
  sector: string;
  anomalies: string[];
  rawData?: Record<string, any>;
}

export interface WorkOrder {
  id: string;
  serialNo: string;
  dealName: string;
  clientCode: string;
  natureOfWork: string;
  executionStatus: string;
  dataDeliveryDate: string;
  poDate: string;
  documentType: string;
  probableStartDate: string;
  probableEndDate: string;
  ownerCode: string;
  sector: string;
  typeOfWork: string;
  hasSkylarkSoftware: 'YES' | 'NONE';
  softwarePlatform: string;
  lastInvoiceDate: string;
  latestInvoiceNo: string;
  amountExclGst: number;
  amountInclGst: number;
  billedExclGst: number;
  billedInclGst: number;
  collectedInclGst: number;
  toBeBilledExcl: number;
  toBeBilledIncl: number;
  arReceivable: number;
  isPriorityAR: boolean;
  quantityOps: number;
  quantityPO: number;
  quantityBilled: number;
  balanceQuantity: number;
  invoiceStatus: string;
  billingStatus: string;
  woStatus: string;
  anomalies: string[];
  rawData?: Record<string, any>;
}

export interface CrossBoardMetrics {
  totalPipelineValue: number;
  totalWeightedPipeline: number;
  totalWonDealsValue: number;
  totalWorkOrdersContracted: number;
  totalBilledValue: number;
  totalCollectedValue: number;
  totalOutstandingAR: number;
  priorityARValue: number;
  winRatePercent: number;
  dealToWoConversionRatio: number;
  averageExecutionDays: number;
  delayedOrdersCount: number;
  dataQualityScore: number;
  totalAnomaliesCount: number;
}

export interface SectorAnalytics {
  sector: string;
  dealsCount: number;
  pipelineValue: number;
  weightedPipeline: number;
  wonValue: number;
  workOrdersCount: number;
  contractedWOValue: number;
  billedValue: number;
  collectedValue: number;
  arOutstanding: number;
  conversionRate: number;
  deliveryOnTimeRate: number;
}

export interface QueryResult {
  query: string;
  intent: string;
  summary: string;
  keyMetrics: {
    label: string;
    value: string | number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo';
  }[];
  chartConfig?: {
    type: 'bar' | 'funnel' | 'pie' | 'line' | 'composed';
    title: string;
    data: any[];
    dataKeys: { key: string; name: string; color: string }[];
    xAxisKey?: string;
  };
  narrativeBullets: string[];
  strategicInsights: string[];
  dataQualityCaveats: string[];
  confidenceScore: number;
  suggestedFollowups: string[];
  clarificationPrompt?: {
    question: string;
    options: string[];
  };
  drilldownData?: {
    type: 'deals' | 'work_orders' | 'cross_board';
    title: string;
    rows: any[];
    columns: { key: string; label: string; format?: 'currency' | 'date' | 'percent' | 'badge' }[];
  };
}

export interface MondayConfig {
  apiKey: string;
  dealsBoardId: string;
  workOrdersBoardId: string;
  isConnected: boolean;
  boardNames?: {
    deals: string;
    workOrders: string;
  };
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}

export interface LeadershipUpdateReport {
  title: string;
  date: string;
  period: string;
  executiveSummary: string;
  scorecard: {
    pipelineHealth: string;
    revenueRealization: string;
    operationalVelocity: string;
    cashRisk: string;
  };
  sections: {
    heading: string;
    bullets: string[];
    metrics?: { label: string; value: string }[];
  }[];
  highPriorityRisks: {
    category: string;
    item: string;
    impact: string;
    mitigation: string;
  }[];
  actionItems: {
    owner: string;
    task: string;
    deadline: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}
