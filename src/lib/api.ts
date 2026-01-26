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

const API_BASE = '/api';

// Simulated delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
const generateMockPayLink = (id: string, overrides?: Partial<PayLink>): PayLink => ({
  id,
  merchantPubkey: localStorage.getItem('merchantPubkey') || 'DemoMerchant1234567890abcdef',
  amount: Math.floor(Math.random() * 100) + 1,
  token: ['SOL', 'USDC'][Math.floor(Math.random() * 2)] as TokenType,
  status: ['pending', 'paid', 'expired'][Math.floor(Math.random() * 3)] as PayLinkStatus,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  memoEnabled: true,
  receiptFields: {
    merchant: true,
    amount: true,
    token: true,
    timeWindow: false,
    invoiceRef: false,
    paylinkId: true,
  },
  ...overrides,
});

const generateMockReceipt = (id: string, paylinkId: string): Receipt => ({
  id,
  commitmentHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  paylinkId,
  merchantPubkey: localStorage.getItem('merchantPubkey') || 'DemoMerchant1234567890abcdef',
  issuedAt: new Date().toISOString(),
  status: 'valid',
  disclosedFields: {
    merchant: true,
    amount: true,
    token: true,
    timeWindow: false,
    invoiceRef: false,
    paylinkId: true,
  },
});

const generateMockActivity = (paylinkId: string): ActivityEvent[] => [
  {
    id: `act_${Math.random().toString(36).slice(2)}`,
    paylinkId,
    type: 'created',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'PayLink created by merchant',
  },
  {
    id: `act_${Math.random().toString(36).slice(2)}`,
    paylinkId,
    type: 'webhook_received',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    details: 'Helius webhook triggered',
  },
];

// API Client
class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    await delay(300 + Math.random() * 500);
    
    // Simulate occasional errors
    if (Math.random() < 0.02) {
      return { error: 'Network error. Please try again.', status: 500 };
    }
    
    return { data: undefined as T, status: 200 };
  }

  // PayLinks
  async getPayLinks(params?: {
    status?: PayLinkStatus;
    token?: TokenType;
    q?: string;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<PayLink>>> {
    await delay(400);
    
    const mockPayLinks = Array.from({ length: 10 }, (_, i) =>
      generateMockPayLink(`pl_${Math.random().toString(36).slice(2)}`)
    );
    
    let filtered = mockPayLinks;
    if (params?.status && params.status !== 'pending') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    if (params?.token) {
      filtered = filtered.filter(p => p.token === params.token);
    }
    
    return {
      data: {
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: 10,
        hasMore: false,
      },
      status: 200,
    };
  }

  async getPayLink(id: string): Promise<ApiResponse<PayLink>> {
    await delay(300);
    return {
      data: generateMockPayLink(id),
      status: 200,
    };
  }

  async createPayLink(data: {
    amount: number;
    token: TokenType;
    tokenMint?: string;
    expiresAt: string;
    invoiceRef?: string;
    memoEnabled: boolean;
    receiptFields: ReceiptFieldPolicy;
  }): Promise<ApiResponse<PayLink>> {
    await delay(600);
    const id = `pl_${Math.random().toString(36).slice(2)}`;
    return {
      data: generateMockPayLink(id, {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
      status: 201,
    };
  }

  async cancelPayLink(id: string): Promise<ApiResponse<PayLink>> {
    await delay(400);
    return {
      data: generateMockPayLink(id, { status: 'cancelled' }),
      status: 200,
    };
  }

  async getPayLinkActivity(id: string): Promise<ApiResponse<ActivityEvent[]>> {
    await delay(300);
    return {
      data: generateMockActivity(id),
      status: 200,
    };
  }

  async getPayLinkReceipts(id: string): Promise<ApiResponse<Receipt[]>> {
    await delay(300);
    return {
      data: [generateMockReceipt(`rcpt_${Math.random().toString(36).slice(2)}`, id)],
      status: 200,
    };
  }

  // Receipts
  async getReceipts(params?: {
    merchant?: string;
    paylinkId?: string;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<Receipt>>> {
    await delay(400);
    
    const receipts = Array.from({ length: 5 }, (_, i) =>
      generateMockReceipt(
        `rcpt_${Math.random().toString(36).slice(2)}`,
        `pl_${Math.random().toString(36).slice(2)}`
      )
    );
    
    return {
      data: {
        items: receipts,
        total: receipts.length,
        page: params?.page || 1,
        pageSize: 10,
        hasMore: false,
      },
      status: 200,
    };
  }

  async getReceipt(id: string): Promise<ApiResponse<Receipt>> {
    await delay(300);
    return {
      data: generateMockReceipt(id, `pl_${Math.random().toString(36).slice(2)}`),
      status: 200,
    };
  }

  async verifyReceipt(request: VerifyRequest): Promise<ApiResponse<VerifyResponse>> {
    await delay(800);
    
    const fields = Object.entries(request.proof.disclosedFields)
      .filter(([_, v]) => v !== undefined)
      .map(([k]) => k);
    
    return {
      data: {
        valid: true,
        verifiedFields: fields,
        signature: request.proof.signature,
        paylinkStatus: 'paid',
      },
      status: 200,
    };
  }

  // Fees
  async getPriorityFeeEstimate(): Promise<ApiResponse<FeeEstimate>> {
    await delay(500);
    return {
      data: {
        low: 5000,
        medium: 25000,
        high: 100000,
        unit: 'lamports',
      },
      status: 200,
    };
  }

  // Simulated payment (UI only)
  async simulatePayment(paylinkId: string): Promise<ApiResponse<{ signature: string }>> {
    await delay(2000);
    return {
      data: {
        signature: Array.from({ length: 88 }, () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
            Math.floor(Math.random() * 62)
          ]
        ).join(''),
      },
      status: 200,
    };
  }
}

export const api = new ApiClient();
