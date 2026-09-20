// Types and Mock Data for QC PORTAL

export type RoleType = 'developer' | 'leader' | 'tester' | 'operator';

export interface RoleInfo {
  id: RoleType;
  initials: string;
  name: string;
  roleTitle: string;
  permission: string;
  description: string;
  mission: string;
}

export interface Criterion {
  id: number;
  question: string;
  passed: boolean;
  description: string;
}

export interface TracingSpan {
  id: string;
  service: string;
  operation: string;
  durationMs: number;
  startOffsetMs: number;
  status: 'normal' | 'bottleneck' | 'anti-pattern';
  indentLevel: number;
  type: 'http' | 'internal' | 'db' | 'rpc' | 'cache';
  details?: string;
}

export interface DbQueryQuality {
  id: string;
  query: string;
  calls: number;
  durationMs: number;
  flags: string[];
  status: 'ok' | 'warning' | 'alert';
  table: string;
}

export interface SrsMappingRule {
  ruleCode: string;
  ruleDescription: string;
  mappedService: string;
  codeRef: string;
  matchStatus: 'Khớp hoàn toàn' | 'Sai khác runtime' | 'Chưa triển khai';
  isMatch: boolean;
}

export interface ChangeImpactItem {
  service: string;
  impactLevel: 'Cao' | 'Trung bình' | 'Thấp';
  riskNote: string;
  downstreamCount: number;
  affectedEndpoints: string[];
}

export interface ServiceHealthMetric {
  serviceName: string;
  status: 'Khoẻ mạnh' | 'Cảnh báo' | 'Nguy cấp';
  errorRate: string;
  p95: string;
  throughput: string;
  memoryUsage: string;
}

export interface ErrorBudgetData {
  slo: string;
  budgetRemaining: string;
  burnRate: string;
  usedPercent: number;
  window: string;
}

export interface IncidentItem {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'Đang mở' | 'Đã xử lý';
  time: string;
  service: string;
}

export interface ExecutionPathCoverage {
  pathName: string;
  runtimeExecuted: boolean;
  hasAutomatedTest: boolean;
  testStatus: 'Pass' | 'Fail' | 'No Test';
  coverageType: string;
}

export interface TestGapItem {
  gapId: string;
  description: string;
  riskLevel: 'Cao' | 'Trung bình' | 'Thấp';
  recommendedTestCase: string;
  suggestedAction: string;
}

export interface FlowEvidence {
  developer: {
    tracingSpans: TracingSpan[];
    databaseQuality: DbQueryQuality[];
  };
  leader: {
    srsMapping: SrsMappingRule[];
    changeImpact: ChangeImpactItem[];
  };
  operator: {
    serviceHealth: ServiceHealthMetric[];
    errorBudget: ErrorBudgetData;
    incidents: IncidentItem[];
  };
  tester: {
    executionCoverage: ExecutionPathCoverage[];
    testGaps: TestGapItem[];
  };
}

export interface FlowStats {
  spanCount: number;
  totalDurationMs: number;
  issuesCount: number;
  runtimeTestGapCount: number;
}

export interface Flow {
  id: string;
  name: string;
  srsCode: string;
  flowIssuesCount: number;
  criteria: Criterion[];
  evidence: FlowEvidence;
  stats: FlowStats;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  issuesCount: number;
  flows: Flow[];
}

export interface QualityPortalData {
  projectName: string;
  environment: string;
  lastUpdated: string;
  services: ServiceItem[];
}

export const ROLES: Record<RoleType, RoleInfo> = {
  developer: {
    id: 'developer',
    initials: 'NT',
    name: 'Nguyễn Thành',
    roleTitle: 'Developer',
    permission: 'Ghi',
    description: 'Xem tracing luồng và query database để tìm rồi sửa điểm nghẽn.',
    mission: 'Kiểm soát runtime tracing, chi tiết từng span, latency và chất lượng câu truy vấn database.',
  },
  leader: {
    id: 'leader',
    initials: 'AL',
    name: 'Anh Lê',
    roleTitle: 'Developer Leader',
    permission: 'Duyệt',
    description: 'Đối chiếu SRS với Code và xem ảnh hưởng khi thay đổi trước khi duyệt.',
    mission: 'Đối chiếu toàn diện SRS ↔ Code ↔ Tracing và phân tích tác động rủi ro trước khi chấp thuận release.',
  },
  tester: {
    id: 'tester',
    initials: 'HP',
    name: 'Hoàng Phúc',
    roleTitle: 'Tester',
    permission: 'Xem và báo lỗi',
    description: 'Xem độ phủ đường thực thi runtime và các test gap cần bổ sung.',
    mission: 'Phát hiện các nhánh runtime chạy thực tế nhưng thiếu kịch bản automated test hoặc regression test.',
  },
  operator: {
    id: 'operator',
    initials: 'SV',
    name: 'Sơn Vũ',
    roleTitle: 'Operator',
    permission: 'Quản trị',
    description: 'Theo dõi sức khoẻ service, error budget và sự cố đang mở của luồng.',
    mission: 'Giám sát SLO/SLA, mức tiêu hao Error Budget, độ trễ P95 và sự cố đang diễn ra của toàn bộ luồng.',
  },
};

export const MOCK_QC_DATA: QualityPortalData = {
  projectName: 'E-Commerce Core Platform',
  environment: 'Production Runtime Trace (v2.8.4)',
  lastUpdated: 'Vừa cập nhật 2 phút trước',
  services: [
    {
      id: 'order-service',
      name: 'order-service',
      description: 'Quản lý giỏ hàng, khởi tạo và điều phối vòng đời đơn hàng',
      issuesCount: 3,
      flows: [
        {
          id: 'flow-create-order',
          name: 'Tạo đơn hàng',
          srsCode: 'SRS-ORD-001',
          flowIssuesCount: 0,
          criteria: [
            {
              id: 1,
              question: 'Chạy đúng nghiệp vụ đã thiết kế?',
              passed: true,
              description: 'Mọi rule SRS đều khớp với code và tracing.',
            },
            {
              id: 2,
              question: 'Chạy tốt về hiệu năng?',
              passed: true,
              description: 'Tổng thời gian 360ms, không có span nào vượt ngưỡng.',
            },
            {
              id: 3,
              question: 'Chạy tốt về database?',
              passed: true,
              description: 'Không có N+1, query chậm hay lock nào.',
            },
            {
              id: 4,
              question: 'Nếu chưa tốt thì nghẽn ở đâu?',
              passed: true,
              description: 'Không phát hiện điểm nghẽn hay lỗi nào.',
            },
          ],
          stats: {
            spanCount: 4,
            totalDurationMs: 360,
            issuesCount: 0,
            runtimeTestGapCount: 0,
          },
          evidence: {
            developer: {
              tracingSpans: [
                {
                  id: 'span-1',
                  service: 'api-gateway',
                  operation: 'POST /api/v1/orders/checkout',
                  durationMs: 360,
                  startOffsetMs: 0,
                  status: 'normal',
                  indentLevel: 0,
                  type: 'http',
                  details: 'HTTP 200 OK · Ingress proxy routing latency 8ms',
                },
                {
                  id: 'span-2',
                  service: 'order-service',
                  operation: 'OrdersController.handleCreateOrder',
                  durationMs: 320,
                  startOffsetMs: 20,
                  status: 'normal',
                  indentLevel: 1,
                  type: 'internal',
                  details: 'Validate Cart Payload & Order Context Initialization',
                },
                {
                  id: 'span-3',
                  service: 'inventory-service',
                  operation: 'InventoryClient.reserveStock(items[])',
                  durationMs: 110,
                  startOffsetMs: 50,
                  status: 'normal',
                  indentLevel: 2,
                  type: 'rpc',
                  details: 'gRPC Unary Call · Optimistic lock on warehouse stocks',
                },
                {
                  id: 'span-4',
                  service: 'order-db (PostgreSQL)',
                  operation: 'UPDATE orders SET status = $1, total = $2 WHERE id = $3',
                  durationMs: 45,
                  startOffsetMs: 190,
                  status: 'normal',
                  indentLevel: 3,
                  type: 'db',
                  details: 'Rows affected: 1 · Index scan: idx_orders_pkey',
                },
              ],
              databaseQuality: [
                {
                  id: 'db-1',
                  query: 'UPDATE orders SET status = $1, total = $2 WHERE id = $3',
                  calls: 1,
                  durationMs: 45,
                  flags: ['INDEX_SCAN', 'TX_SAFE', 'NO_LOCK_WAIT'],
                  status: 'ok',
                  table: 'orders',
                },
                {
                  id: 'db-2',
                  query: 'SELECT sku, quantity, warehouse_id FROM inventory WHERE sku = ANY($1)',
                  calls: 1,
                  durationMs: 28,
                  flags: ['COVERING_INDEX', 'READ_COMMITTED'],
                  status: 'ok',
                  table: 'inventory',
                },
                {
                  id: 'db-3',
                  query: 'SELECT id, tier, discount_pct FROM customer_tiers WHERE customer_id = $1',
                  calls: 1,
                  durationMs: 12,
                  flags: ['CACHE_HIT_REDIS', 'LOW_LATENCY'],
                  status: 'ok',
                  table: 'customers',
                },
              ],
            },
            leader: {
              srsMapping: [
                {
                  ruleCode: 'SRS-ORD-R1',
                  ruleDescription: 'Xác thực định dạng giỏ hàng & kiểm tra tồn kho trước khi tạo record',
                  mappedService: 'order-service, inventory-service',
                  codeRef: 'order-service/src/commands/create-order.handler.ts:42',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-ORD-R2',
                  ruleDescription: 'Tạm giữ số lượng tồn kho (reserve) trong vòng 15 phút',
                  mappedService: 'inventory-service',
                  codeRef: 'inventory-service/src/grpc/stock.service.ts:118',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-ORD-R3',
                  ruleDescription: 'Khởi tạo mã phiên thanh toán tạm thời đồng bộ trong luồng',
                  mappedService: 'payment-service',
                  codeRef: 'payment-service/src/session/token.generator.ts:85',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-ORD-R4',
                  ruleDescription: 'Phát event OrderCreated qua Kafka Topic `orders.events`',
                  mappedService: 'order-service',
                  codeRef: 'order-service/src/events/kafka.publisher.ts:63',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
              ],
              changeImpact: [
                {
                  service: 'inventory-service',
                  impactLevel: 'Trung bình',
                  riskNote: 'Thay đổi cấu trúc DTO reserveStock sẽ ảnh hưởng đến kiểm tra kho',
                  downstreamCount: 4,
                  affectedEndpoints: ['POST /grpc/reserveStock', 'GET /stock/status'],
                },
                {
                  service: 'payment-service',
                  impactLevel: 'Cao',
                  riskNote: 'Phụ thuộc vào format mã OrderId và số tiền định dạng VND/USD',
                  downstreamCount: 7,
                  affectedEndpoints: ['POST /api/v1/payments/intent'],
                },
                {
                  service: 'notification-service',
                  impactLevel: 'Thấp',
                  riskNote: 'Nhận event bất đồng bộ, lỗi không gây rollback luồng chính',
                  downstreamCount: 2,
                  affectedEndpoints: ['Kafka topic: orders.events'],
                },
              ],
            },
            operator: {
              serviceHealth: [
                {
                  serviceName: 'api-gateway',
                  status: 'Khoẻ mạnh',
                  errorRate: '0.01%',
                  p95: '18ms',
                  throughput: '2,450 req/s',
                  memoryUsage: '42%',
                },
                {
                  serviceName: 'order-service',
                  status: 'Khoẻ mạnh',
                  errorRate: '0.04%',
                  p95: '320ms',
                  throughput: '1,120 req/s',
                  memoryUsage: '58%',
                },
                {
                  serviceName: 'inventory-service',
                  status: 'Khoẻ mạnh',
                  errorRate: '0.02%',
                  p95: '110ms',
                  throughput: '890 req/s',
                  memoryUsage: '39%',
                },
                {
                  serviceName: 'payment-service',
                  status: 'Khoẻ mạnh',
                  errorRate: '0.08%',
                  p95: '95ms',
                  throughput: '640 req/s',
                  memoryUsage: '51%',
                },
              ],
              errorBudget: {
                slo: '99.90%',
                budgetRemaining: '80.00%',
                burnRate: '0.8x (An toàn)',
                usedPercent: 20,
                window: 'Chu kỳ 30 ngày gần nhất',
              },
              incidents: [
                {
                  id: 'INC-8821',
                  title: 'Cảnh báo tăng nhẹ latency do gRPC reconnect lúc 03:15 AM',
                  severity: 'P3',
                  status: 'Đã xử lý',
                  time: 'Hôm nay, 03:15',
                  service: 'inventory-service',
                },
              ],
            },
            tester: {
              executionCoverage: [
                {
                  pathName: 'Nhánh: Kiểm tra giỏ hàng rỗng / hợp lệ (Payload Validation)',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'Unit & Integration Test',
                },
                {
                  pathName: 'Nhánh: Tồn kho đủ số lượng & Khóa tạm (Happy Path)',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'E2E API Test (Postman/Newman)',
                },
                {
                  pathName: 'Nhánh: Ghi nhận đơn hàng trạng thái PENDING vào PostgreSQL',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'Database Integration Test',
                },
                {
                  pathName: 'Nhánh: Sinh token thanh toán hợp lệ với payment-service',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'Contract Test (Pact)',
                },
              ],
              testGaps: [],
            },
          },
        },
        {
          id: 'flow-cancel-order',
          name: 'Huỷ đơn hàng',
          srsCode: 'SRS-ORD-003',
          flowIssuesCount: 0,
          criteria: [
            {
              id: 1,
              question: 'Chạy đúng nghiệp vụ đã thiết kế?',
              passed: true,
              description: 'Hoàn trả tồn kho và cập nhật trạng thái CANCELLED chuẩn SRS.',
            },
            {
              id: 2,
              question: 'Chạy tốt về hiệu năng?',
              passed: true,
              description: 'Tổng thời gian phản hồi 185ms, đáp ứng tiêu chuẩn SLA < 300ms.',
            },
            {
              id: 3,
              question: 'Chạy tốt về database?',
              passed: true,
              description: 'Sử dụng batch release và không giữ transaction lâu.',
            },
            {
              id: 4,
              question: 'Nếu chưa tốt thì nghẽn ở đâu?',
              passed: true,
              description: 'Toàn bộ chuỗi xử lý trôi chảy, không có cảnh báo nào.',
            },
          ],
          stats: {
            spanCount: 3,
            totalDurationMs: 185,
            issuesCount: 0,
            runtimeTestGapCount: 0,
          },
          evidence: {
            developer: {
              tracingSpans: [
                {
                  id: 'span-c1',
                  service: 'api-gateway',
                  operation: 'POST /api/v1/orders/{id}/cancel',
                  durationMs: 185,
                  startOffsetMs: 0,
                  status: 'normal',
                  indentLevel: 0,
                  type: 'http',
                  details: 'HTTP 200 OK · User requested cancellation',
                },
                {
                  id: 'span-c2',
                  service: 'order-service',
                  operation: 'OrdersController.cancelOrder',
                  durationMs: 160,
                  startOffsetMs: 15,
                  status: 'normal',
                  indentLevel: 1,
                  type: 'internal',
                  details: 'Check order status allows cancellation',
                },
                {
                  id: 'span-c3',
                  service: 'inventory-service',
                  operation: 'InventoryClient.releaseStock(items[])',
                  durationMs: 80,
                  startOffsetMs: 30,
                  status: 'normal',
                  indentLevel: 2,
                  type: 'rpc',
                  details: 'Release reserved items back to warehouse pool',
                },
              ],
              databaseQuality: [
                {
                  id: 'db-c1',
                  query: 'UPDATE orders SET status = $1, cancelled_at = NOW() WHERE id = $2',
                  calls: 1,
                  durationMs: 32,
                  flags: ['INDEX_SCAN', 'TX_SAFE'],
                  status: 'ok',
                  table: 'orders',
                },
              ],
            },
            leader: {
              srsMapping: [
                {
                  ruleCode: 'SRS-ORD-R8',
                  ruleDescription: 'Chỉ cho phép huỷ khi đơn chưa qua bước PACKED',
                  mappedService: 'order-service',
                  codeRef: 'order-service/src/rules/cancel-guard.ts:25',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-ORD-R9',
                  ruleDescription: 'Hoàn trả kho ngay lập tức khi lệnh huỷ thành công',
                  mappedService: 'inventory-service',
                  codeRef: 'inventory-service/src/stock/releaser.ts:40',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
              ],
              changeImpact: [
                {
                  service: 'inventory-service',
                  impactLevel: 'Thấp',
                  riskNote: 'Gửi event releaseStock đã được chuẩn hóa',
                  downstreamCount: 2,
                  affectedEndpoints: ['POST /grpc/releaseStock'],
                },
              ],
            },
            operator: {
              serviceHealth: [
                {
                  serviceName: 'order-service',
                  status: 'Khoẻ mạnh',
                  errorRate: '0.00%',
                  p95: '185ms',
                  throughput: '320 req/s',
                  memoryUsage: '52%',
                },
              ],
              errorBudget: {
                slo: '99.90%',
                budgetRemaining: '96.50%',
                burnRate: '0.2x (Rất an toàn)',
                usedPercent: 3.5,
                window: 'Chu kỳ 30 ngày gần nhất',
              },
              incidents: [],
            },
            tester: {
              executionCoverage: [
                {
                  pathName: 'Nhánh: Huỷ khi đơn đang ở trạng thái PENDING',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'E2E Test',
                },
              ],
              testGaps: [],
            },
          },
        },
      ],
    },
    {
      id: 'auth-service',
      name: 'auth-service',
      description: 'Chứng thực người dùng, giải mã JWT, cấp quyền RBAC & session token',
      issuesCount: 1,
      flows: [
        {
          id: 'flow-jwt-verify',
          name: 'Xác thực JWT Token',
          srsCode: 'SRS-AUTH-002',
          flowIssuesCount: 1,
          criteria: [
            {
              id: 1,
              question: 'Chạy đúng nghiệp vụ đã thiết kế?',
              passed: true,
              description: 'Thuật toán RS256 và giải mã claim đúng quy chuẩn SRS.',
            },
            {
              id: 2,
              question: 'Chạy tốt về hiệu năng?',
              passed: false,
              description: 'Phát hiện nghẽn tại Redis session blacklist check (140ms thay vì <10ms).',
            },
            {
              id: 3,
              question: 'Chạy tốt về database?',
              passed: true,
              description: 'Không gọi database chính, chỉ tra cứu cache bộ nhớ.',
            },
            {
              id: 4,
              question: 'Nếu chưa tốt thì nghẽn ở đâu?',
              passed: false,
              description: 'Nghẽn tại span Redis connection pool timeout do thiếu connection size.',
            },
          ],
          stats: {
            spanCount: 3,
            totalDurationMs: 165,
            issuesCount: 1,
            runtimeTestGapCount: 1,
          },
          evidence: {
            developer: {
              tracingSpans: [
                {
                  id: 'span-a1',
                  service: 'api-gateway',
                  operation: 'MIDDLEWARE AuthInterceptor.verifyToken',
                  durationMs: 165,
                  startOffsetMs: 0,
                  status: 'normal',
                  indentLevel: 0,
                  type: 'http',
                  details: 'Bearer Token extraction and validation pipeline',
                },
                {
                  id: 'span-a2',
                  service: 'auth-service',
                  operation: 'JwtService.decodeAndVerifySignature',
                  durationMs: 15,
                  startOffsetMs: 5,
                  status: 'normal',
                  indentLevel: 1,
                  type: 'internal',
                  details: 'Public key caching in memory · CPU 1.2ms',
                },
                {
                  id: 'span-a3',
                  service: 'redis-cluster',
                  operation: 'Redis.SISMEMBER revoked_tokens_set {jti}',
                  durationMs: 140,
                  startOffsetMs: 22,
                  status: 'bottleneck',
                  indentLevel: 2,
                  type: 'cache',
                  details: '⚠️ CẢNH BÁO NGHẼN: Redis client pool exhausted, queued 128ms chờ connection rảnh',
                },
              ],
              databaseQuality: [
                {
                  id: 'db-a1',
                  query: 'REDIS: SISMEMBER blacklist_jti:{prefix} $1',
                  calls: 1,
                  durationMs: 140,
                  flags: ['CONNECTION_POOL_EXHAUSTED', 'HIGH_LATENCY_QUEUE'],
                  status: 'alert',
                  table: 'redis:blacklist',
                },
              ],
            },
            leader: {
              srsMapping: [
                {
                  ruleCode: 'SRS-AUTH-R4',
                  ruleDescription: 'Token phải được đối chiếu với danh sách thu hồi jti tức thời',
                  mappedService: 'auth-service, redis-cluster',
                  codeRef: 'auth-service/src/guards/revocation.guard.ts:54',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-AUTH-R5',
                  ruleDescription: 'Độ trễ xác thực token toàn trình không được vượt quá 30ms',
                  mappedService: 'api-gateway',
                  codeRef: 'gateway/src/config/limits.ts:18',
                  matchStatus: 'Sai khác runtime',
                  isMatch: false,
                },
              ],
              changeImpact: [
                {
                  service: 'toàn bộ microservices',
                  impactLevel: 'Cao',
                  riskNote: 'Mọi request đi qua API Gateway đều chờ middleware này. Latency 165ms làm tăng thời gian chờ toàn hệ thống.',
                  downstreamCount: 18,
                  affectedEndpoints: ['ALL /api/* (Toàn bộ endpoints)'],
                },
              ],
            },
            operator: {
              serviceHealth: [
                {
                  serviceName: 'auth-service',
                  status: 'Cảnh báo',
                  errorRate: '0.85%',
                  p95: '165ms',
                  throughput: '4,800 req/s',
                  memoryUsage: '78%',
                },
                {
                  serviceName: 'redis-cluster',
                  status: 'Cảnh báo',
                  errorRate: '0.12%',
                  p95: '140ms',
                  throughput: '5,200 ops/s',
                  memoryUsage: '82%',
                },
              ],
              errorBudget: {
                slo: '99.95%',
                budgetRemaining: '44.00%',
                burnRate: '2.4x (Cảnh báo tiêu hao nhanh)',
                usedPercent: 56,
                window: 'Chu kỳ 30 ngày gần nhất',
              },
              incidents: [
                {
                  id: 'INC-8902',
                  title: 'Redis connection pool starvation trong giờ cao điểm',
                  severity: 'P2',
                  status: 'Đang mở',
                  time: 'Hôm nay, 14:20',
                  service: 'redis-cluster',
                },
              ],
            },
            tester: {
              executionCoverage: [
                {
                  pathName: 'Nhánh: Token hợp lệ chưa hết hạn',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'Unit Test',
                },
                {
                  pathName: 'Nhánh: Xử lý khi Redis pool bị nghẽn (Graceful Degradation / Fallback)',
                  runtimeExecuted: true,
                  hasAutomatedTest: false,
                  testStatus: 'No Test',
                  coverageType: 'Chưa có test',
                },
              ],
              testGaps: [
                {
                  gapId: 'GAP-AUTH-01',
                  description: 'Chưa có bài kiểm thử chịu tải (load test) mô phỏng 10,000 req/s để xác định kích thước Redis connection pool chuẩn.',
                  riskLevel: 'Cao',
                  recommendedTestCase: 'Viết kịch bản k6 / Locust kiểm thử ngưỡng connection pool exhaustion',
                  suggestedAction: 'Bổ sung ngay vào pipeline CI/CD trước release tiếp theo',
                },
              ],
            },
          },
        },
      ],
    },
    {
      id: 'payment-service',
      name: 'payment-service',
      description: 'Cổng thanh toán điện tử, tích hợp đối tác ngân hàng & đối soát',
      issuesCount: 2,
      flows: [
        {
          id: 'flow-process-webhook',
          name: 'Xử lý Webhook thanh toán',
          srsCode: 'SRS-PAY-004',
          flowIssuesCount: 2,
          criteria: [
            {
              id: 1,
              question: 'Chạy đúng nghiệp vụ đã thiết kế?',
              passed: true,
              description: 'Xác thực chữ ký HMAC-SHA256 chuẩn quy cách đối tác.',
            },
            {
              id: 2,
              question: 'Chạy tốt về hiệu năng?',
              passed: false,
              description: 'Tổng thời gian xử lý webhook lên tới 540ms do lặp query N+1.',
            },
            {
              id: 3,
              question: 'Chạy tốt về database?',
              passed: false,
              description: 'Phát hiện Anti-pattern: N+1 query lặp 14 lần vào bảng payment_logs.',
            },
            {
              id: 4,
              question: 'Nếu chưa tốt thì nghẽn ở đâu?',
              passed: false,
              description: 'Anti-pattern N+1 query trong vòng lặp parse chi tiết giao dịch.',
            },
          ],
          stats: {
            spanCount: 6,
            totalDurationMs: 540,
            issuesCount: 2,
            runtimeTestGapCount: 1,
          },
          evidence: {
            developer: {
              tracingSpans: [
                {
                  id: 'span-p1',
                  service: 'api-gateway',
                  operation: 'POST /webhooks/vnpay/callback',
                  durationMs: 540,
                  startOffsetMs: 0,
                  status: 'normal',
                  indentLevel: 0,
                  type: 'http',
                  details: 'Incoming external webhook from VNPay payment provider',
                },
                {
                  id: 'span-p2',
                  service: 'payment-service',
                  operation: 'WebhookReceiver.processCallback',
                  durationMs: 515,
                  startOffsetMs: 15,
                  status: 'normal',
                  indentLevel: 1,
                  type: 'internal',
                  details: 'Verify HMAC signature and parse payload batch items',
                },
                {
                  id: 'span-p3',
                  service: 'payment-db (PostgreSQL)',
                  operation: 'SELECT * FROM payments WHERE tx_code = $1',
                  durationMs: 25,
                  startOffsetMs: 40,
                  status: 'normal',
                  indentLevel: 2,
                  type: 'db',
                  details: 'Index hit: idx_payments_tx_code',
                },
                {
                  id: 'span-p4',
                  service: 'payment-db (PostgreSQL)',
                  operation: '🔥 ANTI-PATTERN: N+1 SELECT * FROM payment_logs WHERE payment_id = $1 (Lặp 14 lần)',
                  durationMs: 380,
                  startOffsetMs: 70,
                  status: 'anti-pattern',
                  indentLevel: 2,
                  type: 'db',
                  details: '❌ ANTI-PATTERN PHÁT HIỆN: 14 queries tuần tự thay vì 1 batch IN query, tiêu tốn 380ms',
                },
                {
                  id: 'span-p5',
                  service: 'order-service',
                  operation: 'OrderClient.notifyPaymentSuccess(orderId)',
                  durationMs: 65,
                  startOffsetMs: 460,
                  status: 'normal',
                  indentLevel: 2,
                  type: 'rpc',
                  details: 'HTTP POST sync callback to order service',
                },
              ],
              databaseQuality: [
                {
                  id: 'db-p1',
                  query: 'SELECT * FROM payment_logs WHERE payment_id = $1',
                  calls: 14,
                  durationMs: 380,
                  flags: ['ANTI_PATTERN_N_PLUS_ONE', 'SEQUENTIAL_EXECUTION', 'MISSING_BATCH_FETCH'],
                  status: 'alert',
                  table: 'payment_logs',
                },
                {
                  id: 'db-p2',
                  query: 'UPDATE payments SET status = $1, bank_ref = $2 WHERE id = $3',
                  calls: 1,
                  durationMs: 42,
                  flags: ['INDEX_SCAN', 'TX_SAFE'],
                  status: 'ok',
                  table: 'payments',
                },
              ],
            },
            leader: {
              srsMapping: [
                {
                  ruleCode: 'SRS-PAY-R1',
                  ruleDescription: 'Bắt buộc đối soát chữ ký số bảo mật trước khi thay đổi trạng thái giao dịch',
                  mappedService: 'payment-service',
                  codeRef: 'payment-service/src/crypto/hmac.validator.ts:31',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-PAY-R2',
                  ruleDescription: 'Cập nhật trạng thái Idempotency (chống xử lý trùng lặp webhook)',
                  mappedService: 'payment-service',
                  codeRef: 'payment-service/src/idempotency/guard.ts:22',
                  matchStatus: 'Khớp hoàn toàn',
                  isMatch: true,
                },
                {
                  ruleCode: 'SRS-PAY-R5',
                  ruleDescription: 'Thời gian phản hồi webhook phải dưới 500ms để tránh đối tác retry bão request',
                  mappedService: 'payment-service',
                  codeRef: 'payment-service/src/webhooks/vnpay.controller.ts:48',
                  matchStatus: 'Sai khác runtime',
                  isMatch: false,
                },
              ],
              changeImpact: [
                {
                  service: 'order-service',
                  impactLevel: 'Cao',
                  riskNote: 'Webhook chậm gây trễ cập nhật trạng thái đơn sang PAID, khách hàng tưởng đơn lỗi',
                  downstreamCount: 5,
                  affectedEndpoints: ['POST /api/v1/orders/{id}/paid'],
                },
              ],
            },
            operator: {
              serviceHealth: [
                {
                  serviceName: 'payment-service',
                  status: 'Cảnh báo',
                  errorRate: '1.20%',
                  p95: '540ms',
                  throughput: '340 req/s',
                  memoryUsage: '71%',
                },
                {
                  serviceName: 'payment-db',
                  status: 'Cảnh báo',
                  errorRate: '0.05%',
                  p95: '380ms',
                  throughput: '1,800 qps',
                  memoryUsage: '65%',
                },
              ],
              errorBudget: {
                slo: '99.95%',
                budgetRemaining: '38.00%',
                burnRate: '3.1x (Cảnh báo)',
                usedPercent: 62,
                window: 'Chu kỳ 30 ngày gần nhất',
              },
              incidents: [
                {
                  id: 'INC-8930',
                  title: 'Cổng đối tác gửi retry hàng loạt do webhook timeout > 500ms',
                  severity: 'P2',
                  status: 'Đang mở',
                  time: 'Hôm nay, 16:05',
                  service: 'payment-service',
                },
              ],
            },
            tester: {
              executionCoverage: [
                {
                  pathName: 'Nhánh: Webhook hợp lệ & thanh toán thành công',
                  runtimeExecuted: true,
                  hasAutomatedTest: true,
                  testStatus: 'Pass',
                  coverageType: 'Integration Test',
                },
                {
                  pathName: 'Nhánh: Xử lý đối soát N giao dịch con (Batch Parsing)',
                  runtimeExecuted: true,
                  hasAutomatedTest: false,
                  testStatus: 'No Test',
                  coverageType: 'Chưa có test hiệu năng',
                },
              ],
              testGaps: [
                {
                  gapId: 'GAP-PAY-02',
                  description: 'Thiếu test kiểm tra hiệu năng truy vấn database khi đơn hàng có nhiều item (hiện tượng N+1 không được bắt ở Unit Test mock).',
                  riskLevel: 'Cao',
                  recommendedTestCase: 'Bổ sung Testcontainers DB test đếm số câu SELECT thực tế phát sinh',
                  suggestedAction: 'Cài đặt DB query count assertion trong suite kiểm thử',
                },
              ],
            },
          },
        },
      ],
    },
  ],
};
