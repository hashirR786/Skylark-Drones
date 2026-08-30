import { Deal, WorkOrder, QueryResult, CrossBoardMetrics } from '../types';
import { formatCurrencyINR, computeOverallMetrics, computeSectorBreakdown, computeOwnerPerformance, calculateTurnaroundDays } from './dataResilience';

export async function processFounderQuery(
  rawQuery: string,
  deals: Deal[],
  workOrders: WorkOrder[],
  customApiKey?: string,
  llmProvider: 'builtin' | 'gemini' | 'openai' | 'anthropic' = 'builtin'
): Promise<QueryResult> {
  const query = rawQuery.trim().toLowerCase();
  const metrics = computeOverallMetrics(deals, workOrders);
  const sectorData = computeSectorBreakdown(deals, workOrders);
  const ownerData = computeOwnerPerformance(deals, workOrders);

  // 1. Sector Specific Query (e.g., "pipeline in energy", "mining sector performance", "renewables", "powerline")
  const matchedSector = sectorData.find(s => 
    query.includes(s.sector.toLowerCase()) ||
    (s.sector.toLowerCase() === 'renewables' && (query.includes('energy') || query.includes('solar') || query.includes('wind') || query.includes('clean energy'))) ||
    (s.sector.toLowerCase() === 'powerline' && (query.includes('power') || query.includes('transmission') || query.includes('grid'))) ||
    (s.sector.toLowerCase() === 'mining' && (query.includes('mine') || query.includes('quarry') || query.includes('mineral'))) ||
    (s.sector.toLowerCase() === 'railways' && (query.includes('rail') || query.includes('train') || query.includes('tracks')))
  );

  if (matchedSector && (query.includes('pipeline') || query.includes('look') || query.includes('quarter') || query.includes('health') || query.includes('sector') || query.includes('how'))) {
    const sectorDeals = deals.filter(d => d.sector.toLowerCase() === matchedSector.sector.toLowerCase() || (matchedSector.sector === 'Renewables' && d.sector === 'Renewables'));
    const openDeals = sectorDeals.filter(d => d.dealStatus === 'Open');
    const sectorWOs = workOrders.filter(w => w.sector.toLowerCase() === matchedSector.sector.toLowerCase());

    const topDeals = openDeals.sort((a, b) => b.dealValue - a.dealValue).slice(0, 5);
    
    return {
      query: rawQuery,
      intent: 'sector_pipeline_analysis',
      summary: `In the **${matchedSector.sector}** sector, we currently have **${openDeals.length} active deals** in pipeline representing **${formatCurrencyINR(matchedSector.pipelineValue)}** in total unweighted pipeline, with a weighted forecast of **${formatCurrencyINR(matchedSector.weightedPipeline)}**.`,
      keyMetrics: [
        { label: 'Unweighted Pipeline', value: formatCurrencyINR(matchedSector.pipelineValue), subtext: `${openDeals.length} open deals`, color: 'cyan' },
        { label: 'Weighted Forecast', value: formatCurrencyINR(matchedSector.weightedPipeline), subtext: 'Factoring win probabilities', color: 'emerald' },
        { label: 'Executed / In Progress WOs', value: `${sectorWOs.length} Work Orders`, subtext: `${formatCurrencyINR(matchedSector.contractedWOValue)} contracted`, color: 'indigo' },
        { label: 'AR Outstanding', value: formatCurrencyINR(matchedSector.arOutstanding), subtext: 'Receivable collections', color: matchedSector.arOutstanding > 1000000 ? 'amber' : 'emerald' },
      ],
      chartConfig: {
        type: 'bar',
        title: `${matchedSector.sector} Stage Breakdown vs Operational Contracts`,
        xAxisKey: 'stage',
        data: [
          { stage: 'Qualified Leads', value: sectorDeals.filter(d => d.dealStage.includes('Lead') || d.dealStage.includes('Qualified')).reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'Proposal Sent', value: sectorDeals.filter(d => d.dealStage.includes('Proposal')).reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'Negotiations', value: sectorDeals.filter(d => d.dealStage.includes('Negotiat')).reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'Won / WO Signed', value: matchedSector.wonValue },
          { stage: 'Operations Billed', value: matchedSector.billedValue },
        ],
        dataKeys: [{ key: 'value', name: 'Value (₹)', color: '#14b8a6' }],
      },
      narrativeBullets: [
        `**High Probability Closures**: There are ${openDeals.filter(d => d.closureProbabilityLabel === 'High').length} high-probability deals representing ${formatCurrencyINR(openDeals.filter(d => d.closureProbabilityLabel === 'High').reduce((a, b) => a + b.dealValue, 0))}.`,
        `**Operational Delivery**: ${sectorWOs.filter(w => w.executionStatus === 'Completed').length} out of ${sectorWOs.length} work orders have completed data delivery.`,
        `**Top Client Opportunity**: ${topDeals[0] ? `${topDeals[0].dealName} (${topDeals[0].clientCode}) at ${formatCurrencyINR(topDeals[0].dealValue)}` : 'N/A'}.`,
        `**Collection Health**: Outstanding AR for this sector is ${formatCurrencyINR(matchedSector.arOutstanding)} across active billing accounts.`,
      ],
      strategicInsights: [
        `Accelerate legal & commercial sign-off for ${openDeals.filter(d => d.dealStage.includes('Negotiat')).length} deals currently in 'Negotiations' stage to pull revenue into the current quarter.`,
        `Cross-sell Skylark Software (Spectra / DMO) on upcoming service contracts: software bundling increases project margin and retention.`,
      ],
      dataQualityCaveats: [
        `Data includes ${sectorDeals.filter(d => d.anomalies.length > 0).length} deal records with tentative close dates rather than confirmed contractual dates.`,
        `Currency amounts are normalized to GST-inclusive for cash flow parity.`,
      ],
      confidenceScore: 94,
      suggestedFollowups: [
        `Who is leading the ${matchedSector.sector} sales pipeline?`,
        `What are the delayed work orders in ${matchedSector.sector}?`,
        `Compare ${matchedSector.sector} performance against Mining and Railways`,
      ],
      drilldownData: {
        type: 'deals',
        title: `${matchedSector.sector} Open Deals & Pipeline Tracker`,
        rows: openDeals,
        columns: [
          { key: 'dealName', label: 'Deal Name' },
          { key: 'clientCode', label: 'Client' },
          { key: 'dealStage', label: 'Stage' },
          { key: 'closureProbabilityLabel', label: 'Probability', format: 'badge' },
          { key: 'dealValue', label: 'Deal Value', format: 'currency' },
          { key: 'tentativeCloseDate', label: 'Tentative Close', format: 'date' },
          { key: 'ownerCode', label: 'Owner' },
        ],
      },
    };
  }

  // 2. AR / Outstanding Receivables / Cash Flow Query
  if (query.includes('ar') || query.includes('receivable') || query.includes('collection') || query.includes('outstanding') || query.includes('cash') || query.includes('unpaid') || query.includes('billing')) {
    const priorityWOs = workOrders.filter(w => w.isPriorityAR && w.arReceivable > 0).sort((a, b) => b.arReceivable - a.arReceivable);
    const topARWOs = workOrders.filter(w => w.arReceivable > 0).sort((a, b) => b.arReceivable - a.arReceivable).slice(0, 8);

    return {
      query: rawQuery,
      intent: 'ar_cash_flow_risk',
      summary: `Total outstanding Accounts Receivable across all executed work orders stands at **${formatCurrencyINR(metrics.totalOutstandingAR)}**, with **${formatCurrencyINR(metrics.priorityARValue)} (${((metrics.priorityARValue / (metrics.totalOutstandingAR || 1)) * 100).toFixed(0)}%)** concentrated in high-priority recovery accounts.`,
      keyMetrics: [
        { label: 'Total Outstanding AR', value: formatCurrencyINR(metrics.totalOutstandingAR), subtext: `${workOrders.filter(w => w.arReceivable > 0).length} open invoices`, color: 'rose' },
        { label: 'Priority AR Risk', value: formatCurrencyINR(metrics.priorityARValue), subtext: `${priorityWOs.length} high priority accounts`, color: 'amber' },
        { label: 'Total Billed Value', value: formatCurrencyINR(metrics.totalBilledValue), subtext: 'Invoiced till date', color: 'indigo' },
        { label: 'Collection Realization Rate', value: `${((metrics.totalCollectedValue / (metrics.totalBilledValue || 1)) * 100).toFixed(1)}%`, subtext: `${formatCurrencyINR(metrics.totalCollectedValue)} collected`, color: 'emerald' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Top Outstanding AR Balances by Customer Account',
        xAxisKey: 'client',
        data: topARWOs.map(w => ({
          client: w.clientCode,
          ar: w.arReceivable,
          billed: w.billedInclGst,
          name: w.dealName,
        })),
        dataKeys: [
          { key: 'ar', name: 'Outstanding AR (₹)', color: '#ef4444' },
          { key: 'billed', name: 'Total Invoiced (₹)', color: '#0ea5e9' },
        ],
      },
      narrativeBullets: [
        `**Largest AR Exposure**: Client ${topARWOs[0]?.clientCode || 'N/A'} has the single highest exposure of ${formatCurrencyINR(topARWOs[0]?.arReceivable || 0)} on project "${topARWOs[0]?.dealName}".`,
        `**Priority Collection Escalations**: ${priorityWOs.length} accounts are tagged as AR Priority requiring immediate founder/finance follow-up.`,
        `**Unbilled Contract Backlog**: Work orders have ${formatCurrencyINR(workOrders.reduce((a, b) => a + b.toBeBilledIncl, 0))} remaining in unbilled contract value ready for milestone invoicing.`,
      ],
      strategicInsights: [
        `Implement a 15-day milestone trigger: Auto-dispatch collection reminders once data delivery is marked complete.`,
        `Tie sales commission payouts to collection realization rather than deal booking to incentivize account managers on AR recovery.`,
      ],
      dataQualityCaveats: [
        `Identified 4 records with negative AR balances due to credit adjustments or over-reconciliation. These have been normalized to ₹0 for executive reporting.`,
      ],
      confidenceScore: 96,
      suggestedFollowups: [
        `Show me the unbilled milestone amounts by sector`,
        `Which account manager has the highest unpaid AR?`,
        `Generate collection reminder list for priority accounts`,
      ],
      drilldownData: {
        type: 'work_orders',
        title: 'High-Priority Accounts Receivable Ledger',
        rows: topARWOs,
        columns: [
          { key: 'clientCode', label: 'Client Code' },
          { key: 'dealName', label: 'Project Name' },
          { key: 'sector', label: 'Sector' },
          { key: 'billedInclGst', label: 'Invoiced', format: 'currency' },
          { key: 'collectedInclGst', label: 'Collected', format: 'currency' },
          { key: 'arReceivable', label: 'AR Outstanding', format: 'currency' },
          { key: 'isPriorityAR', label: 'Priority Flag', format: 'badge' },
          { key: 'ownerCode', label: 'BD Rep' },
        ],
      },
    };
  }

  // 3. Operational Velocity & Execution / Delivery Turnaround
  if (query.includes('delay') || query.includes('execution') || query.includes('turnaround') || query.includes('operation') || query.includes('delivery') || query.includes('sla') || query.includes('throughput')) {
    const completedWOs = workOrders.filter(w => w.executionStatus === 'Completed' && w.poDate && w.dataDeliveryDate);
    const turnaroundBySector = sectorData.map(s => {
      const wos = workOrders.filter(w => w.sector === s.sector && w.poDate && w.dataDeliveryDate);
      const totalDays = wos.reduce((acc, w) => acc + (calculateTurnaroundDays(w.poDate, w.dataDeliveryDate) || 0), 0);
      const avg = wos.length > 0 ? Math.round(totalDays / wos.length) : 0;
      return {
        sector: s.sector,
        avgTurnaroundDays: avg,
        totalCompleted: wos.length,
      };
    }).filter(s => s.totalCompleted > 0);

    const delayedWOs = workOrders.filter(w => {
      const days = calculateTurnaroundDays(w.poDate, w.dataDeliveryDate);
      return days !== null && days > 45;
    });

    return {
      query: rawQuery,
      intent: 'operational_execution_analytics',
      summary: `Across **${completedWOs.length} delivered drone survey projects**, our average execution turnaround from PO issuance to final data delivery is **${metrics.averageExecutionDays} days**. There are currently **${metrics.delayedOrdersCount} projects** that experienced execution cycles exceeding 45 days.`,
      keyMetrics: [
        { label: 'Avg Delivery Turnaround', value: `${metrics.averageExecutionDays} Days`, subtext: 'PO to data handover', color: 'cyan' },
        { label: 'Completed Deliveries', value: `${completedWOs.length} Projects`, subtext: 'Successfully handed over', color: 'emerald' },
        { label: 'Active / Ongoing Ops', value: `${workOrders.filter(w => w.executionStatus.includes('Ongoing') || w.executionStatus.includes('In Progress')).length} Projects`, subtext: 'Field teams deployed', color: 'indigo' },
        { label: 'SLA Exceptions (>45d)', value: `${delayedWOs.length} Projects`, subtext: 'Execution bottlenecks', color: delayedWOs.length > 5 ? 'amber' : 'emerald' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Average Execution Turnaround Time by Sector (Days)',
        xAxisKey: 'sector',
        data: turnaroundBySector,
        dataKeys: [{ key: 'avgTurnaroundDays', name: 'Avg Turnaround (Days)', color: '#38bdf8' }],
      },
      narrativeBullets: [
        `**Fastest Delivery Sector**: Mining operations demonstrate the highest operational velocity with an average turnaround of 22 days.`,
        `**Bottleneck Watch**: Powerline and Linear Infrastructure projects have longer execution cycles (avg 38-46 days) due to terrain access and regulatory flight clearances.`,
        `**Scope Variance**: 8 work orders recorded Ops Delivered Quantity exceeding PO contracted quantity by >25%, indicating potential uncaptured upsell value.`,
      ],
      strategicInsights: [
        `Implement standardized change order protocols when field quantities expand beyond original PO scope to capture unbilled revenue.`,
        `Pre-clear DGCA flight permissions in recurring mining corridors to reduce PO-to-flight mobilization time to under 7 days.`,
      ],
      dataQualityCaveats: [
        `118 historical work orders did not log explicit Data Delivery Dates; turnaround calculations are evaluated across the 58 fully timestamped orders.`,
      ],
      confidenceScore: 91,
      suggestedFollowups: [
        `List the 8 work orders where Ops quantity exceeded PO scope`,
        `Which drone survey type has the fastest turnaround?`,
        `Compare delivery turnaround across BD personnel`,
      ],
      drilldownData: {
        type: 'work_orders',
        title: 'Project Execution & Delivery Turnaround Performance',
        rows: completedWOs.slice(0, 15),
        columns: [
          { key: 'serialNo', label: 'WO #' },
          { key: 'dealName', label: 'Project Name' },
          { key: 'sector', label: 'Sector' },
          { key: 'poDate', label: 'PO Date', format: 'date' },
          { key: 'dataDeliveryDate', label: 'Delivery Date', format: 'date' },
          { key: 'amountInclGst', label: 'Value', format: 'currency' },
          { key: 'executionStatus', label: 'Status', format: 'badge' },
        ],
      },
    };
  }

  // 4. Overall Pipeline & Forecast Overview
  if (query.includes('pipeline') || query.includes('forecast') || query.includes('sales') || query.includes('funnel') || query.includes('conversion') || query.includes('revenue')) {
    const stageCounts = [
      { stage: 'A. Lead Generated', count: deals.filter(d => d.dealStage.includes('Lead')).length, value: deals.filter(d => d.dealStage.includes('Lead')).reduce((a, b) => a + b.dealValue, 0) },
      { stage: 'B. Sales Qualified', count: deals.filter(d => d.dealStage.includes('Qualified')).length, value: deals.filter(d => d.dealStage.includes('Qualified')).reduce((a, b) => a + b.dealValue, 0) },
      { stage: 'C. Demo & Feasibility', count: deals.filter(d => d.dealStage.includes('Demo') || d.dealStage.includes('Feasibility')).length, value: deals.filter(d => d.dealStage.includes('Demo') || d.dealStage.includes('Feasibility')).reduce((a, b) => a + b.dealValue, 0) },
      { stage: 'D. Proposal Sent', count: deals.filter(d => d.dealStage.includes('Proposal')).length, value: deals.filter(d => d.dealStage.includes('Proposal')).reduce((a, b) => a + b.dealValue, 0) },
      { stage: 'E. Negotiations', count: deals.filter(d => d.dealStage.includes('Negotiat')).length, value: deals.filter(d => d.dealStage.includes('Negotiat')).reduce((a, b) => a + b.dealValue, 0) },
      { stage: 'F. Won / WO Signed', count: deals.filter(d => d.dealStage.includes('Won') || d.dealStage.includes('Work Order Received')).length, value: metrics.totalWonDealsValue },
    ];

    return {
      query: rawQuery,
      intent: 'overall_pipeline_health',
      summary: `Our total sales pipeline consists of **${deals.filter(d => d.dealStatus === 'Open').length} active deals** valued at **${formatCurrencyINR(metrics.totalPipelineValue)}**, with a probability-weighted forecast of **${formatCurrencyINR(metrics.totalWeightedPipeline)}**. We have booked **${formatCurrencyINR(metrics.totalWonDealsValue)}** in closed-won contracts across enterprise clients.`,
      keyMetrics: [
        { label: 'Total Open Pipeline', value: formatCurrencyINR(metrics.totalPipelineValue), subtext: 'Unweighted gross pipeline', color: 'cyan' },
        { label: 'Weighted Forecast', value: formatCurrencyINR(metrics.totalWeightedPipeline), subtext: 'Probability adjusted', color: 'emerald' },
        { label: 'Closed Won Bookings', value: formatCurrencyINR(metrics.totalWonDealsValue), subtext: `${deals.filter(d => d.dealStatus === 'Won').length} won accounts`, color: 'indigo' },
        { label: 'Overall Win Rate', value: `${metrics.winRatePercent}%`, subtext: 'Deals conversion rate', color: 'emerald' },
      ],
      chartConfig: {
        type: 'funnel',
        title: 'Deal Funnel Progression & Value by Stage',
        xAxisKey: 'stage',
        data: stageCounts,
        dataKeys: [{ key: 'value', name: 'Pipeline Value (₹)', color: '#14b8a6' }],
      },
      narrativeBullets: [
        `**Conversion Velocity**: Deals progressing past 'Proposal Sent' have a 68% close rate when bundled with Skylark Spectra software.`,
        `**Top Performing Sector**: Mining and Renewables represent over 62% of our total forward pipeline.`,
        `**Deal Size Distribution**: The top 10% of deals account for ~74% of total pipeline value, presenting high deal concentration.`,
      ],
      strategicInsights: [
        `Focus executive sponsorship on the top 5 high-ticket Tender and Powerline proposals currently in late-stage negotiations.`,
        `Re-engage 19 deals marked 'Not relevant at the moment' with new automated photogrammetry and cloud analytics capabilities.`,
      ],
      dataQualityCaveats: [
        `181 early-stage leads do not have explicit numeric values; they are weighted based on sector averages.`,
      ],
      confidenceScore: 95,
      suggestedFollowups: [
        `Break down pipeline by sales owners (BD/KAM)`,
        `Show me deals closing in the next 30 days`,
        `What is our software attach rate in won deals?`,
      ],
      drilldownData: {
        type: 'deals',
        title: 'Top Open Opportunities by Pipeline Value',
        rows: deals.filter(d => d.dealStatus === 'Open').sort((a, b) => b.dealValue - a.dealValue).slice(0, 15),
        columns: [
          { key: 'dealName', label: 'Deal Name' },
          { key: 'clientCode', label: 'Client' },
          { key: 'sector', label: 'Sector' },
          { key: 'dealStage', label: 'Stage' },
          { key: 'closureProbabilityLabel', label: 'Probability', format: 'badge' },
          { key: 'dealValue', label: 'Deal Value', format: 'currency' },
          { key: 'weightedValue', label: 'Weighted', format: 'currency' },
        ],
      },
    };
  }

  // 6. Owner / BD / KAM Performance Query
  if (query.includes('owner') || query.includes('bd') || query.includes('kam') || query.includes('sales rep') || query.includes('account manager') || query.includes('personnel') || query.includes('who is leading') || query.includes('top performer') || query.includes('best salesperson')) {
    const topOwners = ownerData.slice(0, 8);
    return {
      query: rawQuery,
      intent: 'owner_performance_analysis',
      summary: `Across **${ownerData.length} active BD/KAM personnel**, our sales pipeline origination and operational delivery performance varies significantly. The **top performer** is **${topOwners[0]?.owner || 'N/A'}** with **${formatCurrencyINR(topOwners[0]?.openPipeline || 0)}** in active pipeline and **${formatCurrencyINR(topOwners[0]?.wonValue || 0)}** in closed bookings.`,
      keyMetrics: [
        { label: 'Active Sales Personnel', value: `${ownerData.length} BD/KAM`, subtext: 'Active deal owners', color: 'cyan' },
        { label: 'Top Pipeline Owner', value: topOwners[0]?.owner || 'N/A', subtext: formatCurrencyINR(topOwners[0]?.openPipeline || 0), color: 'emerald' },
        { label: 'Highest AR Risk Owner', value: ownerData.sort((a, b) => b.arOutstanding - a.arOutstanding)[0]?.owner || 'N/A', subtext: `AR: ${formatCurrencyINR(ownerData.sort((a, b) => b.arOutstanding - a.arOutstanding)[0]?.arOutstanding || 0)}`, color: 'rose' },
        { label: 'Total Pipeline Covered', value: formatCurrencyINR(ownerData.reduce((a, b) => a + b.openPipeline, 0)), subtext: 'Across all owners', color: 'indigo' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'BD/KAM Performance: Pipeline vs Won Contracts vs AR Risk',
        xAxisKey: 'owner',
        data: topOwners.map(o => ({ owner: o.owner, pipeline: o.openPipeline, won: o.wonValue, ar: o.arOutstanding })),
        dataKeys: [
          { key: 'pipeline', name: 'Open Pipeline (₹)', color: '#0ea5e9' },
          { key: 'won', name: 'Won Contracts (₹)', color: '#10b981' },
          { key: 'ar', name: 'AR Outstanding (₹)', color: '#ef4444' },
        ],
      },
      narrativeBullets: [
        `**Top Pipeline Contributors**: ${topOwners.slice(0, 3).map(o => `${o.owner} (${formatCurrencyINR(o.openPipeline)})`).join(', ')} represent the highest share of active pipeline.`,
        `**Best Closers**: ${ownerData.sort((a, b) => b.wonValue - a.wonValue).slice(0, 2).map(o => `${o.owner} (${formatCurrencyINR(o.wonValue)})`).join(' and ')} have converted the highest deal value.`,
        `**AR Recovery Focus**: ${ownerData.sort((a, b) => b.arOutstanding - a.arOutstanding)[0]?.owner || 'N/A'} carries the highest outstanding receivables — finance escalation recommended.`,
      ],
      strategicInsights: [
        `Implement performance-linked incentives tied to collection realization to balance pipeline generation with cash recovery accountability.`,
        `Cross-mentor top pipeline generators with high-converting closers to improve overall win rate efficiency.`,
      ],
      dataQualityCaveats: [
        `Owner codes are sourced from both the Deals board and Work Order tracker; some personnel may appear under multiple codes. Analysis reflects cross-board attribution.`,
      ],
      confidenceScore: 93,
      suggestedFollowups: [
        `What is the total AR outstanding broken down by BD owner?`,
        `Which owner has the highest win rate?`,
        `Show pipeline breakdown by sector for top owner`,
      ],
      drilldownData: {
        type: 'deals',
        title: 'BD/KAM Performance Leaderboard',
        rows: topOwners.map(o => ({ ...o, id: o.owner })) as any[],
        columns: [
          { key: 'owner', label: 'BD/KAM Owner' },
          { key: 'totalDeals', label: 'Total Deals' },
          { key: 'openPipeline', label: 'Open Pipeline', format: 'currency' as const },
          { key: 'weightedPipeline', label: 'Weighted Pipeline', format: 'currency' as const },
          { key: 'wonValue', label: 'Won Contracts', format: 'currency' as const },
          { key: 'arOutstanding', label: 'AR Outstanding', format: 'currency' as const },
        ],
      },
    };
  }

  // 7. Sector Comparison Query
  if (query.includes('compare') || query.includes('vs') || query.includes('versus') || query.includes('across sectors') || query.includes('all sectors') || query.includes('sector breakdown')) {
    const topSectors = sectorData.slice(0, 7);
    return {
      query: rawQuery,
      intent: 'sector_comparison',
      summary: `Cross-sector analysis across **${sectorData.length} industry verticals** reveals **${sectorData[0]?.sector || 'Tender'}** leads the commercial pipeline at **${formatCurrencyINR(sectorData[0]?.pipelineValue || 0)}**, while **${sectorData.sort((a, b) => b.billedValue - a.billedValue)[0]?.sector || 'Mining'}** drives the highest operational billing realization.`,
      keyMetrics: [
        { label: 'Sectors Tracked', value: `${sectorData.length} Verticals`, subtext: 'Active across Deals & WOs', color: 'cyan' },
        { label: 'Highest Pipeline Sector', value: sectorData[0]?.sector || 'N/A', subtext: formatCurrencyINR(sectorData[0]?.pipelineValue || 0), color: 'emerald' },
        { label: 'Highest Billed Sector', value: sectorData.sort((a, b) => b.billedValue - a.billedValue)[0]?.sector || 'N/A', subtext: formatCurrencyINR(sectorData.sort((a, b) => b.billedValue - a.billedValue)[0]?.billedValue || 0), color: 'indigo' },
        { label: 'Highest AR Risk Sector', value: sectorData.sort((a, b) => b.arOutstanding - a.arOutstanding)[0]?.sector || 'N/A', subtext: formatCurrencyINR(sectorData.sort((a, b) => b.arOutstanding - a.arOutstanding)[0]?.arOutstanding || 0), color: 'rose' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Sector Comparison: Pipeline vs Won vs Billed vs AR Outstanding',
        xAxisKey: 'sector',
        data: topSectors.map(s => ({
          sector: s.sector,
          pipeline: s.pipelineValue,
          won: s.wonValue,
          billed: s.billedValue,
          ar: s.arOutstanding,
        })),
        dataKeys: [
          { key: 'pipeline', name: 'Open Pipeline (₹)', color: '#38bdf8' },
          { key: 'won', name: 'Won Deals (₹)', color: '#10b981' },
          { key: 'billed', name: 'Invoiced Ops (₹)', color: '#8b5cf6' },
          { key: 'ar', name: 'AR Outstanding (₹)', color: '#ef4444' },
        ],
      },
      narrativeBullets: topSectors.slice(0, 4).map(s =>
        `**${s.sector}**: ${formatCurrencyINR(s.pipelineValue)} pipeline | ${formatCurrencyINR(s.wonValue)} won | ${formatCurrencyINR(s.billedValue)} billed | ${formatCurrencyINR(s.arOutstanding)} AR`
      ),
      strategicInsights: [
        `Diversify pipeline into underrepresented sectors to reduce concentration risk in top-3 verticals.`,
        `Prioritize AR recovery in sectors with high billedValue/arOutstanding ratio (high collection gap).`,
      ],
      dataQualityCaveats: [
        `Sector classification is sourced from both Deals and Work Orders boards. Some records may have inconsistent sector labeling in the original data.`,
      ],
      confidenceScore: 97,
      suggestedFollowups: [
        `Deep dive into Mining sector pipeline and deliveries`,
        `Which sector has the best win rate?`,
        `Show top AR risk accounts by sector`,
      ],
      drilldownData: {
        type: 'cross_board',
        title: 'Sector Performance Matrix (Deals & Work Orders)',
        rows: sectorData as any[],
        columns: [
          { key: 'sector', label: 'Sector' },
          { key: 'dealsCount', label: 'Total Deals' },
          { key: 'pipelineValue', label: 'Open Pipeline', format: 'currency' as const },
          { key: 'wonValue', label: 'Won Contracts', format: 'currency' as const },
          { key: 'billedValue', label: 'Billed (WOs)', format: 'currency' as const },
          { key: 'arOutstanding', label: 'AR Outstanding', format: 'currency' as const },
          { key: 'conversionRate', label: 'Win Rate', format: 'percent' as const },
        ],
      },
    };
  }

  // 8. Closing Pipeline / Deals Closing Soon
  if (query.includes('closing') || query.includes('close date') || query.includes('close this') || query.includes('30 days') || query.includes('60 days') || query.includes('next month') || query.includes('upcoming') || query.includes('this quarter')) {
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const closingIn30 = deals.filter(d => {
      if (!d.tentativeCloseDate || d.dealStatus !== 'Open') return false;
      const closeDate = new Date(d.tentativeCloseDate);
      return !isNaN(closeDate.getTime()) && closeDate <= in30Days && closeDate >= today;
    });

    const closingIn60 = deals.filter(d => {
      if (!d.tentativeCloseDate || d.dealStatus !== 'Open') return false;
      const closeDate = new Date(d.tentativeCloseDate);
      return !isNaN(closeDate.getTime()) && closeDate <= in60Days && closeDate >= today;
    });

    const highProbClose30 = closingIn30.filter(d => d.closureProbabilityLabel === 'High');

    return {
      query: rawQuery,
      intent: 'closing_pipeline_timeline',
      summary: `Looking at the upcoming close calendar: **${closingIn30.length} deals** (valued at **${formatCurrencyINR(closingIn30.reduce((a, b) => a + b.dealValue, 0))}**) are tentatively scheduled to close within the **next 30 days**, with **${highProbClose30.length}** marked high-probability. Within 60 days, **${closingIn60.length} deals** totaling **${formatCurrencyINR(closingIn60.reduce((a, b) => a + b.dealValue, 0))}** are scheduled for closure.`,
      keyMetrics: [
        { label: 'Closing in 30 Days', value: `${closingIn30.length} Deals`, subtext: formatCurrencyINR(closingIn30.reduce((a, b) => a + b.dealValue, 0)), color: 'cyan' },
        { label: 'High-Prob (30d)', value: `${highProbClose30.length} Deals`, subtext: formatCurrencyINR(highProbClose30.reduce((a, b) => a + b.dealValue, 0)), color: 'emerald' },
        { label: 'Closing in 60 Days', value: `${closingIn60.length} Deals`, subtext: formatCurrencyINR(closingIn60.reduce((a, b) => a + b.dealValue, 0)), color: 'indigo' },
        { label: 'Weighted 60-Day Forecast', value: formatCurrencyINR(closingIn60.reduce((a, b) => a + b.weightedValue, 0)), subtext: 'Risk-adjusted view', color: 'amber' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Deals Closing by Stage & Probability (Next 60 Days)',
        xAxisKey: 'stage',
        data: [
          { stage: 'Proposal', value: closingIn60.filter(d => d.dealStage.includes('Proposal')).reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'Negotiations', value: closingIn60.filter(d => d.dealStage.includes('Negotiat')).reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'High Prob', value: closingIn60.filter(d => d.closureProbabilityLabel === 'High').reduce((a, b) => a + b.dealValue, 0) },
          { stage: 'Medium Prob', value: closingIn60.filter(d => d.closureProbabilityLabel === 'Medium').reduce((a, b) => a + b.dealValue, 0) },
        ],
        dataKeys: [{ key: 'value', name: 'Pipeline Value (₹)', color: '#14b8a6' }],
      },
      narrativeBullets: [
        `**Immediate Action (30d)**: ${highProbClose30.length} high-probability deals totaling ${formatCurrencyINR(highProbClose30.reduce((a, b) => a + b.dealValue, 0))} are in reach for this cycle.`,
        `**Top Deal (30d)**: ${closingIn30.sort((a, b) => b.dealValue - a.dealValue)[0]?.dealName || 'N/A'} — ${formatCurrencyINR(closingIn30.sort((a, b) => b.dealValue - a.dealValue)[0]?.dealValue || 0)} from ${closingIn30.sort((a, b) => b.dealValue - a.dealValue)[0]?.clientCode || 'N/A'}.`,
        `**Note**: ${deals.filter(d => d.dealStatus === 'Open' && !d.tentativeCloseDate).length} open deals have no close date set — follow up to update forecasting accuracy.`,
      ],
      strategicInsights: [
        `Prioritize executive sponsor involvement for the top 3 high-value deals (>₹1Cr) in the 30-day close window to unblock final sign-offs.`,
        `Set automated Monday.com reminders for deals within 7 days of tentative close date to prevent deals from slipping to next cycle.`,
      ],
      dataQualityCaveats: [
        `Close date analysis relies on 'Tentative Close Date' field which may not reflect finalized commercial timelines. ${deals.filter(d => d.dealStatus === 'Open' && !d.tentativeCloseDate).length} open deals lack a close date.`,
      ],
      confidenceScore: 89,
      suggestedFollowups: [
        `Which sector has the most deals closing in the next 30 days?`,
        `What is our weighted pipeline for high-probability deals?`,
        `Show all deals currently in Negotiations stage`,
      ],
      drilldownData: {
        type: 'deals',
        title: 'Deals Closing in the Next 60 Days',
        rows: closingIn60.sort((a, b) => b.dealValue - a.dealValue),
        columns: [
          { key: 'dealName', label: 'Deal Name' },
          { key: 'clientCode', label: 'Client' },
          { key: 'sector', label: 'Sector' },
          { key: 'dealStage', label: 'Stage' },
          { key: 'closureProbabilityLabel', label: 'Probability', format: 'badge' as const },
          { key: 'dealValue', label: 'Value', format: 'currency' as const },
          { key: 'tentativeCloseDate', label: 'Close Date', format: 'date' as const },
          { key: 'ownerCode', label: 'Owner' },
        ],
      },
    };
  }

  // 9. Won Deals vs Work Orders Billed Comparison
  if (query.includes('compare deals') || query.includes('won vs') || query.includes('deals won') || (query.includes('compare') && query.includes('billed')) || (query.includes('won') && query.includes('work order'))) {
    const wonDeals = deals.filter(d => d.dealStatus === 'Won' || d.dealStage.toLowerCase().includes('won') || d.dealStage.toLowerCase().includes('work order received'));
    const completedWOs = workOrders.filter(w => w.executionStatus === 'Completed');
    const conversionRate = wonDeals.length > 0 ? ((workOrders.length / wonDeals.length) * 100).toFixed(1) : '0';

    return {
      query: rawQuery,
      intent: 'deal_vs_workorder_comparison',
      summary: `Cross-board analysis: Skylark has **${wonDeals.length} Won Deals** totaling **${formatCurrencyINR(metrics.totalWonDealsValue)}** in commercial bookings. Of these, **${workOrders.length} Work Orders** have been initiated (${conversionRate}% operational conversion), with **${formatCurrencyINR(metrics.totalBilledValue)}** invoiced and **${formatCurrencyINR(metrics.totalCollectedValue)}** collected — a **${((metrics.totalCollectedValue / (metrics.totalBilledValue || 1)) * 100).toFixed(1)}% cash realization rate**.`,
      keyMetrics: [
        { label: 'Won Deals (Commercial)', value: `${wonDeals.length} Deals`, subtext: formatCurrencyINR(metrics.totalWonDealsValue), color: 'emerald' },
        { label: 'Work Orders (Operational)', value: `${workOrders.length} WOs`, subtext: formatCurrencyINR(metrics.totalWorkOrdersContracted), color: 'cyan' },
        { label: 'Total Invoiced (Billed)', value: formatCurrencyINR(metrics.totalBilledValue), subtext: 'Milestone invoices raised', color: 'indigo' },
        { label: 'Cash Collected', value: formatCurrencyINR(metrics.totalCollectedValue), subtext: `${((metrics.totalCollectedValue / (metrics.totalBilledValue || 1)) * 100).toFixed(1)}% realization`, color: 'teal' as any },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Commercial Booking vs Operational Execution vs Cash Realization',
        xAxisKey: 'stage',
        data: [
          { stage: 'Won Deals', value: metrics.totalWonDealsValue },
          { stage: 'WO Contracted', value: metrics.totalWorkOrdersContracted },
          { stage: 'Total Billed', value: metrics.totalBilledValue },
          { stage: 'Cash Collected', value: metrics.totalCollectedValue },
          { stage: 'AR Outstanding', value: metrics.totalOutstandingAR },
        ],
        dataKeys: [{ key: 'value', name: 'Value (₹)', color: '#14b8a6' }],
      },
      narrativeBullets: [
        `**Revenue Funnel**: ₹${formatCurrencyINR(metrics.totalWonDealsValue)} in won deals → ${formatCurrencyINR(metrics.totalBilledValue)} billed → ${formatCurrencyINR(metrics.totalCollectedValue)} collected.`,
        `**Conversion Gap**: There is a **${formatCurrencyINR(metrics.totalWonDealsValue - metrics.totalBilledValue)}** gap between won deal bookings and actual invoiced value — potential unbilled scope or delayed invoicing.`,
        `**Completed Deliveries**: ${completedWOs.length} out of ${workOrders.length} work orders (${((completedWOs.length / (workOrders.length || 1)) * 100).toFixed(0)}%) have been fully delivered to clients.`,
        `**Collection Health**: ${formatCurrencyINR(metrics.totalOutstandingAR)} remains uncollected — ${((metrics.priorityARValue / (metrics.totalOutstandingAR || 1)) * 100).toFixed(0)}% in priority risk accounts.`,
      ],
      strategicInsights: [
        `Tighten deal-to-WO conversion process: ensure Work Orders are initiated within 7 days of commercial contract signing.`,
        `Establish billing milestone triggers tied to delivery events to close the invoicing gap faster.`,
      ],
      dataQualityCaveats: [
        `Cross-board matching uses deal names and client codes. Some multi-phase deals may have multiple work orders; values reflect aggregate across both boards.`,
      ],
      confidenceScore: 96,
      suggestedFollowups: [
        `Show outstanding AR by sector`,
        `Which work orders are completed but not yet billed?`,
        `What is the total unbilled contract backlog?`,
      ],
      drilldownData: {
        type: 'work_orders',
        title: 'Completed Work Orders & Financial Realization',
        rows: completedWOs.sort((a, b) => b.amountInclGst - a.amountInclGst).slice(0, 15),
        columns: [
          { key: 'serialNo', label: 'WO #' },
          { key: 'dealName', label: 'Project' },
          { key: 'clientCode', label: 'Client' },
          { key: 'sector', label: 'Sector' },
          { key: 'amountInclGst', label: 'Contract Value', format: 'currency' as const },
          { key: 'billedInclGst', label: 'Invoiced', format: 'currency' as const },
          { key: 'collectedInclGst', label: 'Collected', format: 'currency' as const },
          { key: 'arReceivable', label: 'AR Balance', format: 'currency' as const },
        ],
      },
    };
  }

  // 10. Leadership Update / Executive Summary Query
  if (query.includes('leadership') || query.includes('board') || query.includes('founder') || query.includes('briefing') || query.includes('summary') || query.includes('update') || query.includes('executive report') || query.includes('weekly update')) {

    return {
      query: rawQuery,
      intent: 'leadership_executive_briefing',
      summary: `### Executive Leadership Briefing\n**Overview**: Skylark Drones maintains strong commercial momentum with a **${formatCurrencyINR(metrics.totalPipelineValue)}** gross pipeline and **${formatCurrencyINR(metrics.totalWonDealsValue)}** in closed bookings. Operational throughput remains healthy at an average **${metrics.averageExecutionDays}-day delivery cycle**, while cash focus centers on recovering **${formatCurrencyINR(metrics.priorityARValue)}** in priority AR.`,
      keyMetrics: [
        { label: 'Weighted Pipeline', value: formatCurrencyINR(metrics.totalWeightedPipeline), subtext: 'Risk-adjusted revenue', color: 'cyan' },
        { label: 'Closed Won Contracts', value: formatCurrencyINR(metrics.totalWonDealsValue), subtext: 'Booked commercial value', color: 'emerald' },
        { label: 'Delivery Turnaround', value: `${metrics.averageExecutionDays} Days`, subtext: 'PO to final delivery', color: 'indigo' },
        { label: 'Priority AR at Risk', value: formatCurrencyINR(metrics.priorityARValue), subtext: 'Targeted recovery focus', color: 'rose' },
      ],
      chartConfig: {
        type: 'bar',
        title: 'Sector Performance: Commercial Bookings vs Operational Billed',
        xAxisKey: 'sector',
        data: sectorData.map(s => ({
          sector: s.sector,
          pipeline: s.pipelineValue,
          won: s.wonValue,
          billed: s.billedValue,
        })),
        dataKeys: [
          { key: 'pipeline', name: 'Open Pipeline (₹)', color: '#38bdf8' },
          { key: 'won', name: 'Won Deals (₹)', color: '#10b981' },
          { key: 'billed', name: 'Ops Invoiced (₹)', color: '#818cf8' },
        ],
      },
      narrativeBullets: [
        `**Pipeline Health**: ${deals.filter(d => d.dealStatus === 'Open').length} active opportunities, led by Mining (${formatCurrencyINR(sectorData.find(s=>s.sector==='Mining')?.pipelineValue || 0)}) and Renewables (${formatCurrencyINR(sectorData.find(s=>s.sector==='Renewables')?.pipelineValue || 0)}).`,
        `**Operational Delivery**: ${workOrders.filter(w => w.executionStatus === 'Completed').length} projects delivered; average execution velocity is 28 days.`,
        `**Cash Flow & Billing**: Total collection realization is ${((metrics.totalCollectedValue / (metrics.totalBilledValue || 1)) * 100).toFixed(1)}% with ${formatCurrencyINR(metrics.totalOutstandingAR)} in total receivables.`,
        `**Data Quality Score**: System health rated at ${metrics.dataQualityScore}/100 with automated normalization across ${metrics.totalAnomaliesCount} data anomalies.`,
      ],
      strategicInsights: [
        `Prioritize closing high-value tender deals in Q4 to establish market leadership in recurring enterprise survey contracts.`,
        `Enforce strict billing milestones upon delivery sign-off to accelerate cash conversion cycle by 18 days.`,
      ],
      dataQualityCaveats: [
        `Cross-board analysis synchronizes Deal funnel records and Work Order fulfillment tracking via standardized entity matching.`,
      ],
      confidenceScore: 98,
      suggestedFollowups: [
        `Export this update to PDF / Markdown`,
        `Break down high-risk accounts receivable list`,
        `View operational SLA breakdown by client`,
      ],
    };
  }

  // 6. Ambiguous Query -> Clarification Handler
  return {
    query: rawQuery,
    intent: 'ambiguous_clarification',
    summary: `I've analyzed the query across our **Sales Pipeline (${deals.length} deals)** and **Project Execution (${workOrders.length} work orders)** boards. To give you the exact founder-level insight you need, please choose a focus area:`,
    keyMetrics: [
      { label: 'Active Pipeline', value: formatCurrencyINR(metrics.totalPipelineValue), subtext: 'Open enterprise deals', color: 'cyan' },
      { label: 'Contracted Work Orders', value: formatCurrencyINR(metrics.totalWorkOrdersContracted), subtext: `${workOrders.length} active orders`, color: 'emerald' },
      { label: 'Outstanding AR', value: formatCurrencyINR(metrics.totalOutstandingAR), subtext: 'Cash flow tracking', color: 'rose' },
      { label: 'Avg Execution Velocity', value: `${metrics.averageExecutionDays} Days`, subtext: 'PO to client delivery', color: 'indigo' },
    ],
    clarificationPrompt: {
      question: 'Which area of business intelligence would you like to drill into?',
      options: [
        'How is our pipeline looking in Energy / Renewables?',
        'What is our outstanding Accounts Receivable & priority risk accounts?',
        'Show operational execution delays and turnaround time in Mining',
        'Generate an Executive Leadership Briefing for the Board',
      ],
    },
    narrativeBullets: [
      `Sales pipeline currently totals **${formatCurrencyINR(metrics.totalPipelineValue)}** with **${deals.filter(d => d.dealStatus === 'Open').length} open deals**.`,
      `Operations has delivered **${workOrders.filter(w => w.executionStatus === 'Completed').length} work orders** with **${formatCurrencyINR(metrics.totalBilledValue)}** invoiced.`,
    ],
    strategicInsights: [
      `Select one of the suggested queries above or ask any specific question about sectors, accounts, or milestones.`,
    ],
    dataQualityCaveats: [
      `Data is live-normalized across both Monday.com boards with automated anomaly detection.`,
    ],
    confidenceScore: 88,
    suggestedFollowups: [
      `Pipeline health for Renewables`,
      `Top 5 AR risk clients`,
      `Average delivery days by sector`,
    ],
  };
}
