// models/auth.model.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  walletBalance: number;
}

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
  role: string;
  walletBalance: number;
  token: string;
}

// models/sms.model.ts
export type SmsType = 'PROMOTIONAL' | 'TRANSACTIONAL' | 'OTP';
export type SmsStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'REJECTED';

export interface SmsRequest {
  mobiles: string[];
  message: string;
  senderId: string;
  type: SmsType;
}

export interface SmsResponse {
  status: string;
  message: string;
  batchId: string;
  totalNumbers: number;
  totalCost: number;
  remainingBalance: number;
  logIds: number[];
}

export interface SmsLog {
  id: number;
  mobile: string;
  message: string;
  senderId: string;
  type: SmsType;
  status: SmsStatus;
  cost: number;
  gatewayMessageId: string;
  batchId: string;
  createdAt: string;
  sentAt: string;
  deliveredAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// models/wallet.model.ts
export interface Wallet {
  walletId: number;
  balance: number;
  totalRecharge: number;
  totalSpent: number;
}

export interface Transaction {
  id: number;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

// models/dashboard.model.ts
export interface DashboardStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  walletBalance: number;
  totalSpent: number;
  sentToday: number;
  deliveryRate: number;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  total: number;
  delivered: number;
}

// models/sender-id.model.ts
export type SenderIdStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SenderID {
  id: number;
  senderId: string;
  status: SenderIdStatus;
  reason: string;
  requestedAt: string;
  approvedAt: string;
}

// models/api-response.model.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
