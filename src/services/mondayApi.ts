import { Deal, WorkOrder } from '../types';

const MONDAY_API_URL = 'https://api.monday.com/v2';
const PROXY_URL = '/api/monday'; // Vercel serverless function proxy

/**
 * Detects if we should use the proxy (Vercel deployment) or direct API
 */
function shouldUseProxy(): boolean {
  // Use proxy if we're not on localhost
  return !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
}

export interface MondayApiResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[] }>;
  error_code?: string;
}

/**
 * Execute a GraphQL query against the Monday.com API v2
 * Uses /api/monday proxy in production (Vercel) to avoid CORS issues
 */
export async function executeMondayGraphQL<T>(apiKey: string, query: string, variables: Record<string, any> = {}): Promise<T> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Monday.com API key is required');
  }

  const useProxy = shouldUseProxy();
  const url = useProxy ? PROXY_URL : MONDAY_API_URL;

  const body = useProxy
    ? JSON.stringify({ query, variables, apiKey })
    : JSON.stringify({ query, variables });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!useProxy) {
    headers['Authorization'] = apiKey;
    headers['API-Version'] = '2024-01';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Monday.com API error (${response.status}): ${errorText}`);
  }

  const result: MondayApiResponse<T> = await response.json();
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Monday.com GraphQL error: ${result.errors.map(e => e.message).join(', ')}`);
  }

  if (!result.data) {
    throw new Error('No data returned from Monday.com');
  }

  return result.data;
}


/**
 * Validates connection with Monday.com API key
 */
export async function testMondayConnection(apiKey: string): Promise<{ success: boolean; user?: { id: string; name: string; email: string }; error?: string }> {
  try {
    const query = `
      query {
        me {
          id
          name
          email
          account {
            name
            slug
          }
        }
      }
    `;
    const data = await executeMondayGraphQL<{ me: { id: string; name: string; email: string } }>(apiKey, query);
    return { success: true, user: data.me };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to authenticate with Monday.com' };
  }
}

/**
 * Fetch available boards in the user's workspace
 */
export async function fetchBoards(apiKey: string): Promise<Array<{ id: string; name: string; state: string }>> {
  const query = `
    query {
      boards(limit: 50) {
        id
        name
        state
      }
    }
  `;
  const data = await executeMondayGraphQL<{ boards: Array<{ id: string; name: string; state: string }> }>(apiKey, query);
  return data.boards || [];
}

/**
 * Fetch items and column values dynamically from a specific Monday board
 */
export async function fetchBoardItems(apiKey: string, boardId: string, limit = 500): Promise<{ name: string; columns: any[]; items: any[] }> {
  const query = `
    query GetBoardDetails($boardId: [ID!], $limit: Int) {
      boards(ids: $boardId) {
        name
        columns {
          id
          title
          type
        }
        items_page(limit: $limit) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;
  const data = await executeMondayGraphQL<{ boards: Array<{ name: string; columns: any[]; items_page: { items: any[] } }> }>(
    apiKey,
    query,
    { boardId: [boardId], limit }
  );

  if (!data.boards || data.boards.length === 0) {
    throw new Error(`Board ID ${boardId} not found in Monday.com`);
  }

  const board = data.boards[0];
  return {
    name: board.name,
    columns: board.columns,
    items: board.items_page?.items || [],
  };
}

/**
 * Parse dynamic Monday items into typed Deal objects
 */
export function mapMondayItemsToDeals(items: any[]): Deal[] {
  return items.map((item, idx) => {
    const colMap: Record<string, string> = {};
    (item.column_values || []).forEach((c: any) => {
      colMap[c.id] = c.text || '';
    });

    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const [colId, colVal] of Object.entries(colMap)) {
          if (colId.toLowerCase().includes(k.toLowerCase()) && colVal) {
            return colVal;
          }
        }
      }
      return '';
    };

    const dealName = item.name || 'Deal';
    const ownerCode = getVal('owner', 'personnel', 'lead', 'rep') || 'OWNER_001';
    const clientCode = getVal('client', 'customer', 'account') || 'COMPANY_001';
    const dealStatus = (getVal('status', 'state') || 'Open') as any;
    const dealStage = getVal('stage', 'pipeline_stage') || 'A. Lead Generated';
    const dealValueRaw = parseFloat(getVal('value', 'amount', 'deal_value').replace(/[^0-9.]/g, '')) || 0;
    const closeDate = getVal('close_date', 'actual_close', 'date') || '';
    const tentativeClose = getVal('tentative', 'expected_close') || '';
    const sector = getVal('sector', 'industry', 'service') || 'General';

    const probText = getVal('probability', 'chance').toLowerCase();
    let probPercent = 0.5;
    let probLabel: any = 'Medium';
    if (probText.includes('high')) { probPercent = 0.85; probLabel = 'High'; }
    else if (probText.includes('low')) { probPercent = 0.25; probLabel = 'Low'; }

    return {
      id: `MONDAY_DEAL_${item.id || idx}`,
      dealName,
      ownerCode,
      clientCode,
      dealStatus: ['Won', 'Dead', 'Open', 'On Hold'].includes(dealStatus) ? dealStatus : 'Open',
      dealStage,
      closureProbabilityLabel: probLabel,
      closureProbabilityPercent: probPercent,
      dealValue: dealValueRaw,
      weightedValue: roundNumber(dealValueRaw * probPercent),
      closeDate,
      tentativeCloseDate: tentativeClose,
      createdDate: new Date().toISOString().split('T')[0],
      productDeal: getVal('product', 'service_type') || 'Standard Drone Operations',
      sector,
      anomalies: dealValueRaw <= 0 ? ['Zero or Missing Deal Value'] : [],
      rawData: { mondayId: item.id, ...colMap },
    };
  });
}

/**
 * Parse dynamic Monday items into typed WorkOrder objects
 */
export function mapMondayItemsToWorkOrders(items: any[]): WorkOrder[] {
  return items.map((item, idx) => {
    const colMap: Record<string, string> = {};
    (item.column_values || []).forEach((c: any) => {
      colMap[c.id] = c.text || '';
    });

    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const [colId, colVal] of Object.entries(colMap)) {
          if (colId.toLowerCase().includes(k.toLowerCase()) && colVal) {
            return colVal;
          }
        }
      }
      return '';
    };

    const getNum = (...keys: string[]) => {
      const valStr = getVal(...keys);
      return parseFloat(valStr.replace(/[^0-9.-]/g, '')) || 0;
    };

    const amountInclGst = getNum('amount_in_rupees', 'contract_value', 'total_amount', 'amount');
    const billedInclGst = getNum('billed_value', 'invoiced', 'billed');
    const collectedInclGst = getNum('collected', 'received', 'collection');
    const arReceivable = getNum('receivable', 'outstanding', 'ar_amount') || Math.max(0, billedInclGst - collectedInclGst);

    return {
      id: `MONDAY_WO_${item.id || idx}`,
      serialNo: getVal('serial', 'wo_number', 'id') || `SDPLDEAL-${idx + 100}`,
      dealName: item.name || 'Work Order',
      clientCode: getVal('customer', 'client') || 'WOCOMPANY_001',
      natureOfWork: getVal('nature', 'scope') || 'Drone Survey',
      executionStatus: getVal('execution', 'status', 'progress') || 'Ongoing',
      dataDeliveryDate: getVal('delivery_date', 'completed_date') || '',
      poDate: getVal('po_date', 'date_of_po') || '',
      documentType: getVal('document_type', 'doc_type') || 'Purchase Order',
      probableStartDate: getVal('start_date') || '',
      probableEndDate: getVal('end_date') || '',
      ownerCode: getVal('personnel', 'bd', 'kam', 'owner') || 'OWNER_001',
      sector: getVal('sector', 'industry') || 'Mining',
      typeOfWork: getVal('type_of_work', 'survey_type') || 'Topography Survey',
      hasSkylarkSoftware: getVal('software', 'spectra').toLowerCase().includes('yes') ? 'YES' : 'NONE',
      softwarePlatform: getVal('software', 'platform') || 'NONE',
      lastInvoiceDate: getVal('last_invoice', 'invoice_date') || '',
      latestInvoiceNo: getVal('invoice_no', 'invoice_number') || '',
      amountExclGst: getNum('excl_gst') || amountInclGst / 1.18,
      amountInclGst,
      billedExclGst: billedInclGst / 1.18,
      billedInclGst,
      collectedInclGst,
      toBeBilledExcl: Math.max(0, (amountInclGst - billedInclGst) / 1.18),
      toBeBilledIncl: Math.max(0, amountInclGst - billedInclGst),
      arReceivable,
      isPriorityAR: getVal('priority', 'ar_priority').toLowerCase().includes('priority'),
      quantityOps: getNum('quantity_ops', 'ops_qty'),
      quantityPO: getNum('quantity_po', 'po_qty'),
      quantityBilled: getNum('quantity_billed'),
      balanceQuantity: getNum('balance_quantity'),
      invoiceStatus: getVal('invoice_status') || 'Open',
      billingStatus: getVal('billing_status') || (billedInclGst >= amountInclGst ? 'Fully Billed' : 'Partially Billed'),
      woStatus: getVal('wo_status') || 'Open',
      anomalies: arReceivable < 0 ? ['Negative AR balance'] : [],
      rawData: { mondayId: item.id, ...colMap },
    };
  });
}

function roundNumber(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
