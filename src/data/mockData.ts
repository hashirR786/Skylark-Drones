import rawDeals from './rawDeals.json';
import rawWorkOrders from './rawWorkOrders.json';
import { Deal, WorkOrder } from '../types';

export const INITIAL_DEALS: Deal[] = rawDeals as unknown as Deal[];
export const INITIAL_WORK_ORDERS: WorkOrder[] = rawWorkOrders as unknown as WorkOrder[];
