export interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  services: number;
  flows: number;
  warns: number;
  verdicts: {
    pass: number;
    warn: number;
    fail: number;
  };
  lastAnalyzed: string;
}

export const MOCK_PROJECTS: ProjectInfo[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Core Platform',
    slug: 'ecommerce-core',
    description: 'Hệ thống thương mại điện tử lõi — quản lý đơn hàng, thanh toán, kho vận',
    icon: '🛒',
    services: 5,
    flows: 12,
    warns: 3,
    verdicts: { pass: 8, warn: 3, fail: 1 },
    lastAnalyzed: '23/09/2026 09:05',
  },
  {
    id: 'ewallet3',
    name: 'Hệ thống ví eWallet3',
    slug: 'ewallet3',
    description: 'Ví điện tử thế hệ 3 — nạp/rút/chuyển tiền, liên kết ngân hàng, QR Pay',
    icon: '💳',
    services: 8,
    flows: 24,
    warns: 5,
    verdicts: { pass: 18, warn: 5, fail: 1 },
    lastAnalyzed: '22/09/2026 17:32',
  },
  {
    id: 'crm-internal',
    name: 'CRM Internal',
    slug: 'crm-internal',
    description: 'Hệ thống quản lý khách hàng nội bộ — ticket, CSKH, báo cáo tương tác',
    icon: '📋',
    services: 3,
    flows: 7,
    warns: 1,
    verdicts: { pass: 6, warn: 1, fail: 0 },
    lastAnalyzed: '21/09/2026 14:18',
  },
];
