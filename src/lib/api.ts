import type {
  PayLink,
  Receipt,
  ActivityEvent,
  FeeEstimate,
  VerifyRequest,
  VerifyResponse,
  ApiResponse,
  PaginatedResponse,
  PayLinkStatus,
  TokenType,
  ReceiptFieldPolicy,
} from './types';
import { getMerchantPubkey } from './merchant';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

const defaultReceiptFields: ReceiptFieldPolicy = {
  merchant: true,
  amount: true,
  token: true,
  timeWindow: false,
  invoiceRef: false,
  paylinkId: true,
};

const mapMintToToken = (mint: string): { token: TokenType; tokenMint?: string } => {
  if (mint === 'SOL' || mint === SOL_MINT) {
    return { token: 'SOL' };
  }
  if (mint.toUpperCase() === 'USDC') {
    return { token: 'USDC' };
  }
  return { token: 'custom', tokenMint: mint };
};

const mapTokenToMint = (token: TokenType, tokenMint?: string): string => {
  if (token === 'SOL') return SOL_MINT;
  if (token === 'USDC') return 'USDC';
  return tokenMint || 'CUSTOM';
};

const normalizeStatus = (status?: string): PayLinkStatus => {
  if (status === 'paid') return 'paid';
  if (status === 'expired') return 'expired';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};

const mapPayLink = (p: any): PayLink => {
  const { token, tokenMint } = mapMintToToken(p.mint || 'SOL');
  return {
    id: p.id,
    merchantPubkey: p.merchantPubkey,
    amount: p.expectedAmount ?? p.amount ?? 0,
    token,
    tokenMint,
    status: normalizeStatus(p.status),
    createdAt: p.createdAt,
    expiresAt: p.expiresAt,
    paidSignature: p.paidSignature ?? undefined,
    invoiceRef: p.invoiceRef ?? undefined,
    memoEnabled: true,
    receiptFields: defaultReceiptFields,
  };
};

const mapReceipt = (r: any): Receipt => {
  const facts = r.facts || {};
  const mint = facts.mint || 'SOL';
  const { token } = mapMintToToken(mint);

  return {
    id: r.id,
    commitmentHash: r.commitment,
    paylinkId: r.paylinkId,
    merchantPubkey: facts.merchantPubkey || 'Unknown',
    issuedAt: r.issuedAt,
    status: 'valid',
    disclosedFields: defaultReceiptFields,
    proofData: undefined,
  };
};

const mapActivity = (e: any): ActivityEvent => {
  const type = (() => {
    switch (e.type) {
      case 'PAYLINK_CREATED':
        return 'created';
      case 'WEBHOOK_RECEIVED':
        return 'webhook_received';
      case 'TX_VERIFIED_MATCH':
        return 'verified';
      case 'RECEIPT_ISSUED':
        return 'receipt_issued';
      case 'PAYLINK_MARKED_PAID':
        return 'verified';
      case 'PAYLINK_EXPIRED':
        return 'expired';
      default:
        return 'created';
    }
  })();

  let details: string | undefined = undefined;
  if (e.detail) {
    if (typeof e.detail === 'string') {
      details = e.detail;
    } else if (e.detail.reason) {
      details = e.detail.reason;
    } else {
      details = JSON.stringify(e.detail);
    }
  }

  return {
    id: e.id?.toString() ?? `${e.type}-${e.at}`,
    paylinkId: e.paylinkId,
    type,
    timestamp: e.at,
    details,
  };
};

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let json: any = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }

      if (!response.ok) {
        const error = json?.error || json?.message || text || 'Request failed';
        return { error, status: response.status };
      }

      return { data: json as T, status: response.status };
    } catch (err) {
      return { error: (err as Error).message, status: 0 };
    }
  }

  async getPayLinks(params?: {
    status?: PayLinkStatus;
    token?: TokenType;
    q?: string;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<PayLink>>> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.token && params.token !== 'custom') {
      search.set('token', mapTokenToMint(params.token));
    }
    if (params?.q) search.set('q', params.q);
    if (params?.page) search.set('page', params.page.toString());

    const res = await this.request<any>(`/paylinks?${search.toString()}`);
    if (res.error || !res.data) return res as ApiResponse<PaginatedResponse<PayLink>>;

    return {
      status: res.status,
      data: {
        items: res.data.items.map(mapPayLink),
        total: res.data.total,
        page: res.data.page,
        pageSize: res.data.pageSize,
        hasMore: res.data.page * res.data.pageSize < res.data.total,
      },
    };
  }

  async getPayLink(id: string): Promise<ApiResponse<PayLink>> {
    const res = await this.request<any>(`/paylinks/${id}`);
    if (res.error || !res.data) return res as ApiResponse<PayLink>;
    return { status: res.status, data: mapPayLink(res.data.paylink) };
  }

  async createPayLink(data: {
    amount: number;
    token: TokenType;
    tokenMint?: string;
    expiresAt: string;
    invoiceRef?: string;
    privacyLevel?: 'standard' | 'enhanced' | 'maximum';
    memoEnabled: boolean;
    receiptFields: ReceiptFieldPolicy;
  }): Promise<ApiResponse<PayLink>> {
    const merchantPubkey = getMerchantPubkey();
    const mint = mapTokenToMint(data.token, data.tokenMint);

    const payload = {
      merchantPubkey,
      expectedAmount: Math.round(data.amount),
      mint,
      expiresAt: data.expiresAt,
      invoiceRef: data.invoiceRef,
      privacyLevel: data.privacyLevel || 'enhanced',
      memoPolicy: {
        enabled: data.memoEnabled,
        template: 'paylink:{id}',
      },
      receiptFieldsPolicy: {
        merchant: data.receiptFields.merchant,
        amount: data.receiptFields.amount,
        token: data.receiptFields.token,
        timeWindow: data.receiptFields.timeWindow,
        invoiceRef: data.receiptFields.invoiceRef,
        paylinkId: data.receiptFields.paylinkId,
      },
    };

    const res = await this.request<any>(`/paylinks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.error || !res.data) return res as ApiResponse<PayLink>;

    return { status: res.status, data: mapPayLink(res.data.paylink) };
  }

  async cancelPayLink(id: string): Promise<ApiResponse<PayLink>> {
    return {
      status: 400,
      error: 'Cancel is not supported by the backend API',
    };
  }

  async getPayLinkActivity(id: string): Promise<ApiResponse<ActivityEvent[]>> {
    const res = await this.request<any>(`/paylinks/${id}/activity`);
    if (res.error || !res.data) return res as ApiResponse<ActivityEvent[]>;
    return { status: res.status, data: res.data.events.map(mapActivity) };
  }

  async getPayLinkReceipts(id: string): Promise<ApiResponse<Receipt[]>> {
    const res = await this.request<any>(`/paylinks/${id}/receipts`);
    if (res.error || !res.data) return res as ApiResponse<Receipt[]>;

    const items = res.data.items.map((r: any) => ({
      id: r.id,
      commitmentHash: r.commitment,
      paylinkId: r.paylinkId,
      merchantPubkey: 'Unknown',
      issuedAt: r.issuedAt,
      status: 'valid' as const,
      disclosedFields: defaultReceiptFields,
    }));

    return { status: res.status, data: items };
  }

  async getReceipts(params?: {
    merchant?: string;
    paylinkId?: string;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<Receipt>>> {
    const search = new URLSearchParams();
    if (params?.merchant) search.set('merchant', params.merchant);
    if (params?.page) search.set('page', params.page.toString());

    const res = await this.request<any>(`/receipts?${search.toString()}`);
    if (res.error || !res.data) return res as ApiResponse<PaginatedResponse<Receipt>>;

    return {
      status: res.status,
      data: {
        items: res.data.items.map(mapReceipt),
        total: res.data.total,
        page: res.data.page,
        pageSize: res.data.pageSize,
        hasMore: res.data.page * res.data.pageSize < res.data.total,
      },
    };
  }

  async getReceipt(id: string): Promise<ApiResponse<Receipt>> {
    const res = await this.request<any>(`/receipts/${id}`);
    if (res.error || !res.data) return res as ApiResponse<Receipt>;
    return { status: res.status, data: mapReceipt(res.data.receipt) };
  }

  async getReceiptProof(
    id: string,
    disclosed: ReceiptFieldPolicy
  ): Promise<ApiResponse<{ proof: any }>> {
    const res = await this.request<any>(`/receipts/${id}/proof`, {
      method: 'POST',
      body: JSON.stringify({ disclosed }),
    });
    if (res.error || !res.data) return res as ApiResponse<{ proof: any }>;
    return { status: res.status, data: res.data };
  }

  async verifyReceipt(request: VerifyRequest): Promise<ApiResponse<VerifyResponse>> {
    const proof: any = request.proof;
    let payload: any = null;

    if (proof && proof.commitment && proof.nonce) {
      payload = {
        proof: {
          commitment: proof.commitment,
          nonce: proof.nonce,
          revealed: proof.revealed || {},
        },
      };
    } else {
      return {
        status: 400,
        error: 'Proof must include commitment and nonce for verification',
      };
    }

    const res = await this.request<any>(`/receipts/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.error || !res.data) return res as ApiResponse<VerifyResponse>;

    return {
      status: res.status,
      data: {
        valid: res.data.verified,
        verifiedFields: res.data.details?.matchedFields || [],
        signature: res.data.details?.paidSignature,
        paylinkStatus: res.data.verified ? 'paid' : undefined,
        mismatches: res.data.verified ? [] : [res.data.reason],
      },
    };
  }

  async getPriorityFeeEstimate(): Promise<ApiResponse<FeeEstimate>> {
    const res = await this.request<any>(`/fees/priority-estimate`, {
      method: 'POST',
      body: JSON.stringify({ level: 'medium' }),
    });
    if (res.error || !res.data) return res as ApiResponse<FeeEstimate>;

    const levels = res.data.levels || { low: 1000, medium: 2000, high: 5000 };
    return {
      status: res.status,
      data: {
        low: levels.low,
        medium: levels.medium,
        high: levels.high,
        unit: 'lamports',
      },
    };
  }

  async simulatePayment(paylinkId: string): Promise<ApiResponse<{ signature: string }>> {
    const res = await this.request<any>(`/paylinks/${paylinkId}/simulate`, {
      method: 'POST',
    });
    if (res.error || !res.data) return res as ApiResponse<{ signature: string }>;
    return { status: res.status, data: res.data };
  }
}

export const api = new ApiClient();
