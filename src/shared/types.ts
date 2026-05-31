// ============================================================
// Shared TypeScript Types — Al Ikhlas Mosque
// ============================================================

// --- Branded Types (type-safe IDs) ---
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TransactionId = Brand<number, 'TransactionId'>;
export type QurbanTierId = Brand<number, 'QurbanTierId'>;
export type ActivityId = Brand<number, 'ActivityId'>;

export const toUserId = (id: string): UserId => id as UserId;
export const toSessionId = (id: string): SessionId => id as SessionId;
export const toTransactionId = (id: number): TransactionId => id as TransactionId;
export const toQurbanTierId = (id: number): QurbanTierId => id as QurbanTierId;
export const toActivityId = (id: number): ActivityId => id as ActivityId;

// --- Transaction Types ---
export type TransactionType = 'jimpitan' | 'hibah' | 'zakat' | 'sedekah' | 'pengeluaran';

export interface Transaction {
  id: TransactionId;
  type: TransactionType;
  amount: number;
  date: string;
  donor_name: string | null;
  description: string;
  category: string | null;
  created_at: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  donor_name?: string;
  description?: string;
  category?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  date?: string;
  donor_name?: string;
  description?: string;
  category?: string;
}

// --- Qurban Tier Types ---
export interface QurbanTier {
  id: QurbanTierId;
  name: string;
  amount: number;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface CreateQurbanTierInput {
  name: string;
  amount: number;
  description?: string;
  sort_order?: number;
}

// --- Activity Types ---
export interface Activity {
  id: ActivityId;
  title: string;
  event_date: string;
  description: string;
  is_active: boolean;
}

export interface CreateActivityInput {
  title: string;
  event_date: string;
  description?: string;
}

// --- User Types ---
export interface User {
  id: UserId;
  username: string | null;
  email: string | null;
  password_hash: string | null;
  provider: 'google' | 'apple' | 'credentials';
  provider_id: string | null;
  role: 'admin';
  created_at: string;
}

// --- API Response Types ---
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Prayer Time Types ---
export interface PrayerTime {
  name: string;
  time: string;
}

// --- Report Types ---
export type ReportType = 'bulanan' | 'tahunan' | 'setelah_idul_adha' | 'setelah_idul_fitri' | 'sebelum_ramadhan';

export interface ReportQuery {
  type: ReportType;
  year: number;
  month?: number;
  internal: boolean;
}

export interface ReportSummary {
  pemasukan: Record<TransactionType, number>;
  pengeluaran: number;
  saldo: number;
  periode: string;
  transactions?: Transaction[];
}
