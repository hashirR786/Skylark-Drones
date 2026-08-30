import { Deal, WorkOrder, CrossBoardMetrics, SectorAnalytics } from '../types';

/**
 * Format currency in Indian Numbering system (Crores / Lakhs / Thousands)
 */
export function formatCurrencyINR(amount: number, options: { compact?: boolean; showSymbol?: boolean } = {}): string {
  const { compact = true, showSymbol = true } = options;
  const prefix = showSymbol ? '₹' : '';
  
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${prefix}0`;
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (!compact) {
    return `${sign}${prefix}${absAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  if (absAmount >= 10000000) {
    // 1 Crore = 10^7
    return `${sign}${prefix}${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    // 1 Lakh = 10^5
    return `${sign}${prefix}${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    return `${sign}${prefix}${(absAmount / 1000).toFixed(1)} K`;
  } else {
    return `${sign}${prefix}${absAmount.toFixed(0)}`;
  }
}

/**
 * Parses and standardizes date strings
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'nan') return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Maps date to Indian Financial Year Quarter (Apr-Jun = Q1, Jul-Sep = Q2, Oct-Dec = Q3, Jan-Mar = Q4)
 */
export function getFiscalQuarter(dateStr: string): string {
  if (!dateStr) return 'Unscheduled';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unscheduled';

  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();

  let q = 'Q1';
  let fy = `${year}-${(year + 1).toString().slice(2)}`;

  if (month >= 4 && month <= 6) {
    q = 'Q1';
    fy = `FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}`;
  } else if (month >= 7 && month <= 9) {
    q = 'Q2';
    fy = `FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}`;
  } else if (month >= 10 && month <= 12) {
    q = 'Q3';
    fy = `FY${year.toString().slice(2)}-${(year + 1).toString().slice(2)}`;
  } else {
    q = 'Q4';
    fy = `FY${(year - 1).toString().slice(2)}-${year.toString().slice(2)}`;
  }

  return `${q} ${fy}`;
}

/**
 * Calculates turnaround days from PO date to delivery date
 */
export function calculateTurnaroundDays(poDate: string, deliveryDate: string): number | null {
  if (!poDate || !deliveryDate) return null;
  const start = new Date(poDate).getTime();
  const end = new Date(deliveryDate).getTime();
  if (isNaN(start) || isNaN(end)) return null;
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
}

/**
 * Computes high-level aggregated metrics across Deals and Work Orders
 */
export function computeOverallMetrics(deals: Deal[], workOrders: WorkOrder[]): CrossBoardMetrics {
  let totalPipelineValue = 0;
  let totalWeightedPipeline = 0;
  let totalWonDealsValue = 0;
  let wonDealsCount = 0;
  let totalDealsCount = deals.length;
  let totalAnomalies = 0;

  deals.forEach((deal) => {
    totalAnomalies += deal.anomalies.length;
    if (deal.dealStatus === 'Open') {
      totalPipelineValue += deal.dealValue || 0;
      totalWeightedPipeline += deal.weightedValue || 0;
    }
    if (deal.dealStatus === 'Won' || deal.dealStage.toLowerCase().includes('won') || deal.dealStage.toLowerCase().includes('work order received')) {
      totalWonDealsValue += deal.dealValue || 0;
      wonDealsCount++;
    }
  });

  let totalContracted = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  let totalAR = 0;
  let priorityAR = 0;
  let turnaroundDaysTotal = 0;
  let turnaroundDaysCount = 0;
  let delayedOrdersCount = 0;

  workOrders.forEach((wo) => {
    totalAnomalies += wo.anomalies.length;
    totalContracted += wo.amountInclGst || 0;
    totalBilled += wo.billedInclGst || 0;
    totalCollected += wo.collectedInclGst || 0;
    
    // Clean AR: ignore tiny floating-point rounding errors near zero
    const cleanAR = Math.max(0, wo.arReceivable || 0);
    totalAR += cleanAR;
    
    if (wo.isPriorityAR) {
      priorityAR += cleanAR;
    }

    const turnaround = calculateTurnaroundDays(wo.poDate, wo.dataDeliveryDate);
    if (turnaround !== null) {
      turnaroundDaysTotal += turnaround;
      turnaroundDaysCount++;
      if (turnaround > 45) {
        delayedOrdersCount++;
      }
    }
  });

  const winRatePercent = totalDealsCount > 0 ? (wonDealsCount / totalDealsCount) * 100 : 0;
  const dealToWoRatio = wonDealsCount > 0 ? (workOrders.length / wonDealsCount) * 100 : 0;
  const avgExecutionDays = turnaroundDaysCount > 0 ? Math.round(turnaroundDaysTotal / turnaroundDaysCount) : 28;
  
  // Data quality score formula (100 minus penalty for anomalies and missing critical dates)
  const penalty = Math.min(45, (totalAnomalies / (deals.length + workOrders.length)) * 25);
  const dataQualityScore = Math.max(50, Math.round(100 - penalty));

  return {
    totalPipelineValue,
    totalWeightedPipeline,
    totalWonDealsValue,
    totalWorkOrdersContracted: totalContracted,
    totalBilledValue: totalBilled,
    totalCollectedValue: totalCollected,
    totalOutstandingAR: totalAR,
    priorityARValue: priorityAR,
    winRatePercent: Number(winRatePercent.toFixed(1)),
    dealToWoConversionRatio: Number(dealToWoRatio.toFixed(1)),
    averageExecutionDays: avgExecutionDays,
    delayedOrdersCount,
    dataQualityScore,
    totalAnomaliesCount: totalAnomalies,
  };
}

/**
 * Sectoral Performance Breakdown across Deals & Operations
 */
export function computeSectorBreakdown(deals: Deal[], workOrders: WorkOrder[]): SectorAnalytics[] {
  const sectorMap = new Map<string, {
    dealsCount: number;
    pipelineValue: number;
    weightedPipeline: number;
    wonValue: number;
    wonCount: number;
    workOrdersCount: number;
    contractedWOValue: number;
    billedValue: number;
    collectedValue: number;
    arOutstanding: number;
    onTimeDeliveries: number;
    totalDeliveries: number;
  }>();

  const getOrCreate = (sec: string) => {
    const cleanSec = sec || 'Others';
    if (!sectorMap.has(cleanSec)) {
      sectorMap.set(cleanSec, {
        dealsCount: 0,
        pipelineValue: 0,
        weightedPipeline: 0,
        wonValue: 0,
        wonCount: 0,
        workOrdersCount: 0,
        contractedWOValue: 0,
        billedValue: 0,
        collectedValue: 0,
        arOutstanding: 0,
        onTimeDeliveries: 0,
        totalDeliveries: 0,
      });
    }
    return sectorMap.get(cleanSec)!;
  };

  deals.forEach((d) => {
    const sec = getOrCreate(d.sector);
    sec.dealsCount++;
    if (d.dealStatus === 'Open') {
      sec.pipelineValue += d.dealValue || 0;
      sec.weightedPipeline += d.weightedValue || 0;
    }
    if (d.dealStatus === 'Won' || d.dealStage.toLowerCase().includes('won')) {
      sec.wonValue += d.dealValue || 0;
      sec.wonCount++;
    }
  });

  workOrders.forEach((wo) => {
    const sec = getOrCreate(wo.sector);
    sec.workOrdersCount++;
    sec.contractedWOValue += wo.amountInclGst || 0;
    sec.billedValue += wo.billedInclGst || 0;
    sec.collectedValue += wo.collectedInclGst || 0;
    sec.arOutstanding += Math.max(0, wo.arReceivable || 0);

    const turnaround = calculateTurnaroundDays(wo.poDate, wo.dataDeliveryDate);
    if (turnaround !== null) {
      sec.totalDeliveries++;
      if (turnaround <= 35) {
        sec.onTimeDeliveries++;
      }
    }
  });

  const results: SectorAnalytics[] = [];
  sectorMap.forEach((data, sector) => {
    const conversionRate = data.dealsCount > 0 ? (data.wonCount / data.dealsCount) * 100 : 0;
    const deliveryOnTimeRate = data.totalDeliveries > 0 ? (data.onTimeDeliveries / data.totalDeliveries) * 100 : 85;

    results.push({
      sector,
      dealsCount: data.dealsCount,
      pipelineValue: data.pipelineValue,
      weightedPipeline: data.weightedPipeline,
      wonValue: data.wonValue,
      workOrdersCount: data.workOrdersCount,
      contractedWOValue: data.contractedWOValue,
      billedValue: data.billedValue,
      collectedValue: data.collectedValue,
      arOutstanding: data.arOutstanding,
      conversionRate: Number(conversionRate.toFixed(1)),
      deliveryOnTimeRate: Number(deliveryOnTimeRate.toFixed(1)),
    });
  });

  return results.sort((a, b) => b.pipelineValue - a.pipelineValue);
}

/**
 * Owner / BD Performance
 */
export function computeOwnerPerformance(deals: Deal[], workOrders: WorkOrder[]) {
  const map = new Map<string, {
    owner: string;
    openPipeline: number;
    weightedPipeline: number;
    wonValue: number;
    dealsWonCount: number;
    totalDeals: number;
    woCount: number;
    arOutstanding: number;
  }>();

  deals.forEach((d) => {
    const owner = d.ownerCode || 'Unassigned';
    if (!map.has(owner)) {
      map.set(owner, { owner, openPipeline: 0, weightedPipeline: 0, wonValue: 0, dealsWonCount: 0, totalDeals: 0, woCount: 0, arOutstanding: 0 });
    }
    const item = map.get(owner)!;
    item.totalDeals++;
    if (d.dealStatus === 'Open') {
      item.openPipeline += d.dealValue || 0;
      item.weightedPipeline += d.weightedValue || 0;
    }
    if (d.dealStatus === 'Won' || d.dealStage.toLowerCase().includes('won')) {
      item.wonValue += d.dealValue || 0;
      item.dealsWonCount++;
    }
  });

  workOrders.forEach((wo) => {
    const owner = wo.ownerCode || 'Unassigned';
    if (!map.has(owner)) {
      map.set(owner, { owner, openPipeline: 0, weightedPipeline: 0, wonValue: 0, dealsWonCount: 0, totalDeals: 0, woCount: 0, arOutstanding: 0 });
    }
    const item = map.get(owner)!;
    item.woCount++;
    item.arOutstanding += Math.max(0, wo.arReceivable || 0);
  });

  return Array.from(map.values()).sort((a, b) => b.openPipeline - a.openPipeline);
}
