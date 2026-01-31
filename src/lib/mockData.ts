import type { Receipt } from './types';

// Mock receipt for demo/testing purposes
export const createMockReceipt = (id: string = 'demo-receipt-1'): Receipt => {
  return {
    id,
    commitmentHash: 'a3f5b8c2d9e1f4a7b6c3d8e2f5a9b4c7d1e6f3a8b5c2d9e4f7a1b8c5d2e9f6a3',
    paylinkId: 'demo-paylink-123',
    merchantPubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    issuedAt: new Date().toISOString(),
    status: 'valid',
    disclosedFields: {
      merchant: true,
      amount: true,
      token: true,
      timeWindow: false,
      invoiceRef: false,
      paylinkId: false,
    },
    proofData: {
      amount: 1000000, // 1 SOL
      token: 'SOL',
      merchant: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      timestamp: new Date().toISOString(),
      signature: '5xKLm9Tn3ZvQp2Yd7Rs8Nw4Jc6Vb1Hf3Gx9Kp2Mn8Ld5Qs7Rt4Wx6Yn1Zp3Km9Lq8',
      invoiceRef: 'INV-2024-001',
      paylinkId: 'demo-paylink-123',
    },
  };
};

// Check if we should use mock data (demo mode)
export const isDemoMode = () => {
  return import.meta.env.MODE === 'development' ||
         window.location.hostname === 'localhost' ||
         localStorage.getItem('demo_mode') === 'true';
};

// Mock receipts list
export const mockReceipts: Receipt[] = [
  createMockReceipt('demo-receipt-1'),
  {
    ...createMockReceipt('demo-receipt-2'),
    issuedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    proofData: {
      amount: 500000, // 0.5 SOL
      token: 'SOL',
      merchant: '8yNXt92DZ56p8Qk3Lx9Ry7Mw6Jv2Bc5Hg1Kn4Zq7Px9',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      signature: '3wRt6Yx2Kp9Nm5Lq8Zv7Jc4Bd1Hf6Gx3Mn2Kp9Qd8Rs5Wn7Yt1Zx4Km6Lp3Nq9',
      invoiceRef: 'INV-2024-002',
      paylinkId: 'demo-paylink-456',
    },
  },
  {
    ...createMockReceipt('demo-receipt-3'),
    issuedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    proofData: {
      amount: 2500000, // 2.5 SOL
      token: 'SOL',
      merchant: '9zMXy13Ea67r9Ql4Ny0Sz8Px7Kw3Cd6Ih2Lo5Zr8Qy0',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      signature: '4xSu7Zx3Lr0Op6Nq9Kw8Jd5Ce2If7Hy4No3Lr0Re9Ts6Xo8Zu2Zy5Ln7Mr4Or0',
      invoiceRef: 'INV-2024-003',
      paylinkId: 'demo-paylink-789',
    },
  },
];
