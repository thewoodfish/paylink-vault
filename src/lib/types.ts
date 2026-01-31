export type PayLinkStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export type TokenType = 'SOL' | 'USDC' | 'custom';

export interface PayLink {
  id: string;
  merchantPubkey: string;
  amount: number;
  token: TokenType;
  tokenMint?: string;
  status: PayLinkStatus;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  paidSignature?: string;
  invoiceRef?: string;
  memoEnabled: boolean;
  receiptFields: ReceiptFieldPolicy;
}

export interface ReceiptFieldPolicy {
  merchant: boolean;
  amount: boolean;
  token: boolean;
  timeWindow: boolean;
  invoiceRef: boolean;
  paylinkId: boolean;
}

export interface Receipt {
  id: string;
  commitmentHash: string;
  paylinkId: string;
  merchantPubkey: string;
  issuedAt: string;
  status: 'valid' | 'unknown' | 'revoked';
  disclosedFields: ReceiptFieldPolicy;
  proofData?: ReceiptProof;
}

export interface ReceiptProof {
  // Legacy demo fields
  commitmentHash?: string;
  disclosedFields?: Partial<{
    merchant: string;
    amount: number;
    token: string;
    timeWindow: { start: number; end: number };
    invoiceRef: string;
    paylinkId: string;
  }>;
  signature?: string;
  timestamp?: number;

  // Backend verification fields
  commitment?: string;
  nonce?: string;
  revealed?: Partial<{
    paylinkId: string;
    merchantPubkey: string;
    amount: number;
    mint: string;
    slot: number;
    invoiceRef: string;
  }>;
}

export interface ActivityEvent {
  id: string;
  paylinkId: string;
  type: 'created' | 'webhook_received' | 'verified' | 'receipt_issued' | 'expired' | 'cancelled';
  timestamp: string;
  details?: string;
}

export interface FeeEstimate {
  low: number;
  medium: number;
  high: number;
  unit: 'lamports';
}

export interface VerifyRequest {
  proof: ReceiptProof;
}

export interface VerifyResponse {
  valid: boolean;
  verifiedFields: string[];
  signature?: string;
  paylinkStatus?: PayLinkStatus;
  mismatches?: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MerchantSettings {
  pubkey: string;
  displayName: string;
  accentColor: string;
  environment: 'devnet' | 'mainnet';
  webhookUrl?: string;
}
