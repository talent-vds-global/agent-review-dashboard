# agent-review-dashboard — QC Portal

Web portal hiển thị kết quả đảm bảo chất lượng phần mềm. Mỗi vai trò (Developer / Leader / Tester /
Operator) nhìn cùng một luồng nghiệp vụ nhưng thấy **bằng chứng khác nhau** phù hợp với việc của mình.

Ứng dụng có **hai chế độ**, chuyển qua lại bằng tab ở đầu trang:

| Chế độ | Nguồn dữ liệu | Dùng để |
|---|---|---|
| **Mô phỏng (Mock)** | `src/data/mock.ts` — dữ liệu tĩnh trong repo | Demo trọn vẹn 4 góc nhìn vai trò, không cần backend |
| **Dữ liệu thật (API)** | Backend [agent-review](https://github.com/talent-vds-global/agent-review) | Xem kết luận thật của AI Agent cho một flow |

Chế độ hiện tại lưu ở URL hash: `#live` = API thật, không hash = Mock.

---

## 1. Tech stack

- React 19 + TypeScript
- Vite 8 (dev server & build)
- CSS Modules (mỗi component một file `*.module.css`)
- `react-markdown` — render kết luận Markdown của agent
- `lucide-react` — icon
- `oxlint` — linter
- Build production: Docker multi-stage → nginx

Không dùng router: điều hướng bằng state trong `useApp()` và một hash duy nhất (`#live`).

---

## 2. Cấu trúc thư mục

```text
agent-review-dashboard/
├── index.html
├── vite.config.ts
├── package.json
├── Dockerfile                # multi-stage: node build → nginx serve
├── docker-compose.yml        # qc-portal, host 3000 → container 80
├── nginx.conf                # SPA fallback + gzip + cache assets
│
└── src/
    ├── main.tsx              # Điểm vào React
    ├── App.tsx               # Chuyển chế độ Mock ↔ Live, điều hướng màn hình
    ├── index.css, App.css    # Style toàn cục & biến CSS
    │
    ├── hooks/
    │   └── useApp.ts         # State điều hướng: login → role_guide → dashboard
    │
    ├── services/
    │   ├── api.ts            # Client gọi backend agent-review
    │   └── authService.ts    # Đăng nhập giả lập bằng localStorage
    │
    ├── data/
    │   ├── mock.ts           # Toàn bộ type + MOCK_QC_DATA + ROLES
    │   └── dummy.ts          # 4 tài khoản demo
    │
    └── screens/
        ├── Login/            # Đăng nhập
        ├── RoleLogin/        # Màn hình giới thiệu & chọn vai trò
        ├── LiveAnalysis/     # Chế độ API thật
        └── Dashboard/        # Chế độ Mock
            ├── useDashboard.ts
            └── components/
                ├── ServiceSidebar/   # Cây service → flow
                ├── StatsBar/         # Số span, tổng thời gian, số vấn đề, test gap
                ├── CriteriaCard/     # 4 câu hỏi chất lượng của flow
                ├── FlowDetail/       # Khung chi tiết flow
                ├── EvidencePanel/    # Bằng chứng — đổi nội dung theo vai trò
                └── ReportModal/      # Báo cáo chất lượng, in được
```

Quy ước trong repo: mỗi màn hình / component phức tạp tách thành `index.tsx` (JSX) +
`use<Tên>.ts` (state & logic) + `<Tên>.module.css` (style).

---

## 3. Chạy ở môi trường dev

### Yêu cầu

- Node.js 22+ (Dockerfile dùng `node:22-alpine`)
- npm

### Các bước

```bash
npm install
```

```bash
npm run dev
```

Vite mở tại `http://localhost:5173`.

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server có HMR |
| `npm run build` | `tsc -b` kiểm tra kiểu rồi build ra `dist/` |
| `npm run preview` | Chạy thử bản build `dist/` |
| `npm run lint` | Chạy oxlint |

---

## 4. Cấu hình backend URL

`src/services/api.ts` đọc biến `VITE_API_BASE_URL`, mặc định `http://localhost:8000`.

Tạo file `.env.local` ở thư mục gốc repo nếu backend nằm chỗ khác:

```env
VITE_API_BASE_URL=http://10.0.0.5:8000
```

Client có sẵn **fallback**: nếu `fetch` tới `localhost` ném lỗi mạng, nó thử lại đúng URL đó với
`127.0.0.1` — xử lý trường hợp trình duyệt phân giải `localhost` thành IPv6 `::1` trong khi Flask chỉ
lắng nghe IPv4.

> Vite nhúng biến môi trường vào lúc **build**, không đọc lúc chạy. Vì vậy image Docker được build
> bằng `docker compose up` sẽ cố định `http://localhost:8000`. Muốn khác, truyền biến vào bước build
> (xem §7).

---

## 5. Chế độ Mô phỏng (Mock)

Không cần backend. Dữ liệu lấy từ `MOCK_QC_DATA` trong `src/data/mock.ts`.

### Đăng nhập

Xác thực do `authService` giả lập hoàn toàn ở phía trình duyệt: so mật khẩu với
`src/data/dummy.ts`, sinh token giả, lưu `localStorage`. **Không có backend auth.**

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `dev` | `dev123` | Developer |
| `leader` | `lead123` | Developer Leader |
| `tester` | `test123` | Tester |
| `ops` | `ops123` | Operator |

Đăng nhập được bằng username hoặc email (`dev@qcportal.io`…). Màn Login còn có khối **DemoAccounts**
để chọn nhanh tài khoản, và link **"Xem thông tin chi tiết quyền hạn 4 vai trò"** mở màn hình
`RoleLogin` mô tả từng vai trò; chọn một vai trò ở đó sẽ quay về màn Login với username điền sẵn.

### Màn hình Dashboard

```text
┌───────────────────────────────────────────────────────────┐
│ QC PORTAL / <tên dự án>        [Sinh báo cáo] [User ▾]     │
├──────────────┬────────────────────────────────────────────┤
│ ServiceSide  │ StatsBar: span · thời gian · vấn đề · gap   │
│  bar         ├────────────────────────────────────────────┤
│  service     │ CriteriaCard: 4 câu hỏi chất lượng          │
│   └ flow     ├────────────────────────────────────────────┤
│   └ flow     │ EvidencePanel: bằng chứng theo VAI TRÒ      │
└──────────────┴────────────────────────────────────────────┘
```

Bốn câu hỏi chất lượng cố định cho mỗi flow:

1. Chạy đúng nghiệp vụ đã thiết kế?
2. Chạy tốt về hiệu năng?
3. Chạy tốt về database?
4. Nếu chưa tốt thì nghẽn ở đâu?

### Bằng chứng theo vai trò

`EvidencePanel` đọc `flow.evidence` rồi hiển thị đúng phần của vai trò đang đăng nhập:

| Vai trò | Thấy gì |
|---|---|
| **Developer** | Tracing từng span (biểu đồ thanh, đánh dấu *bottleneck* / *anti-pattern*) + chất lượng câu truy vấn DB (số lần gọi, thời gian, cờ N+1…) |
| **Leader** | Đối chiếu SRS ↔ Code (khớp / sai khác runtime / chưa triển khai) + phân tích phạm vi ảnh hưởng khi thay đổi |
| **Tester** | Độ phủ đường thực thi runtime (chạy thật nhưng có test chưa?) + danh sách test gap kèm đề xuất test case |
| **Operator** | Sức khoẻ service (error rate, p95, throughput, memory) + Error Budget + sự cố đang mở |

### Báo cáo

Nút **"Sinh báo cáo chất lượng"** mở `ReportModal`: tính điểm tuân thủ = số tiêu chí đạt / tổng tiêu chí,
và in ra bằng `window.print()`.

### Đổi dữ liệu mock

Sửa `MOCK_QC_DATA` trong `src/data/mock.ts`. Cấu trúc lồng nhau:

```text
QualityPortalData
└── services[]          ServiceItem
    └── flows[]         Flow
        ├── criteria[]  Criterion       (4 câu hỏi)
        ├── stats       FlowStats       (số liệu cho StatsBar)
        └── evidence    FlowEvidence
            ├── developer { tracingSpans[], databaseQuality[] }
            ├── leader    { srsMapping[], changeImpact[] }
            ├── tester    { executionCoverage[], testGaps[] }
            └── operator  { serviceHealth[], errorBudget, incidents[] }
```

Mọi type đều khai báo ngay trong file đó, nên `tsc -b` sẽ báo lỗi nếu thiếu trường.

---

## 6. Chế độ Dữ liệu thật (API)

Bấm tab **"Dữ liệu thật (API)"** hoặc mở thẳng `http://localhost:5173/#live`.

Màn hình `LiveAnalysis` **không yêu cầu đăng nhập** — vào thẳng.

### Điều kiện

Backend [agent-review](https://github.com/talent-vds-global/agent-review) phải đang chạy và **đã có
ít nhất một bản ghi** cho flow đang chọn:

```bash
curl -X POST http://localhost:8000/runtime -H "Content-Type: application/json" -d "{\"flow_id\":\"F1\",\"service\":\"ewallet-payment-order\"}"
```

### Endpoint sử dụng

| Gọi | Dùng cho |
|---|---|
| `GET /api/flows/<flow_id>/analysis` | Nội dung chính: verdict, `detail`, `runtime_flow`, thời gian |
| `GET /api/analysis` | Đổ danh sách flow vào dropdown chọn flow |

Hai lời gọi chạy song song; nếu lấy danh sách flow lỗi thì bỏ qua, chỉ lỗi ở lời gọi chính mới hiện
thẻ báo lỗi.

### Giao diện

- **Panel trái — Luồng thực thi runtime**: tách `runtime_flow` theo dòng, đánh số, dòng nào chứa
  `[LỖI]` thì tô đỏ và gắn nhãn *CẢNH BÁO LỖI*. Badge đếm tổng số bước và số bước lỗi.
- **Panel phải — Kết luận phân tích**: render `detail` bằng `react-markdown`.
- **Badge verdict**: `PASS` (✓ xanh) / `WARN` (⚠ vàng) / `FAIL` (✕ đỏ).
- **Nút Làm mới**: gọi lại cả hai API. Không có auto-refresh — phải bấm tay.
- Thời gian format theo múi giờ `Asia/Ho_Chi_Minh`.

### Khi lỗi

Thẻ lỗi hiện thông báo từ backend kèm URL đang gọi và nút **Thử lại ngay**. Nguyên nhân hay gặp:
backend chưa chạy, chưa có bản ghi cho flow (404), hoặc CORS.

---

## 7. Build & triển khai Docker

```bash
docker compose up --build
```

Portal chạy tại `http://localhost:3000`.

Dockerfile gồm 2 stage:

1. `node:22-alpine` — `npm ci` rồi `npm run build` ra `dist/`
2. `nginx:alpine` — copy `dist/` vào `/usr/share/nginx/html`, dùng `nginx.conf` với SPA fallback
   (`try_files … /index.html`), gzip, và cache 1 năm cho `/assets/`

### Đổi backend URL cho bản build

`VITE_API_BASE_URL` được nhúng lúc build, nên phải truyền vào **stage build**. Thêm `ARG` + `ENV` vào
Dockerfile trước dòng `RUN npm run build`:

```dockerfile
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

Rồi khai báo trong `docker-compose.yml`:

```yaml
build:
  context: .
  dockerfile: Dockerfile
  args:
    VITE_API_BASE_URL: http://backend-host:8000
```

Nếu không làm bước này, bản build trong Docker sẽ luôn gọi `http://localhost:8000` — tức là máy của
**người dùng trình duyệt**, không phải máy chạy container.

---

## 8. Chạy trọn bộ demo

```text
ewallet-demo (Java + OTel)  →  Jaeger :16686
        ↓ trace
agent-review (Flask)        :8000   ← POST /runtime sinh kết quả
        ↓ GET /api/...
agent-review-dashboard      :5173 (dev) hoặc :3000 (docker)
```

1. Dựng `ewallet-demo` và tạo vài giao dịch để có trace trong Jaeger.
2. Dựng `agent-review` (PostgreSQL + Flask), nạp `seed.sql` **và** `analysis_table.sql`.
3. Gọi `POST /runtime` ít nhất một lần cho flow cần xem.
4. Chạy dashboard, bấm tab **Dữ liệu thật (API)**.

---

## 9. Hiện trạng & giới hạn

| Hạng mục | Trạng thái |
|---|---|
| Đăng nhập | ⚠️ giả lập hoàn toàn ở client, mật khẩu để plaintext trong `src/data/dummy.ts` — **chỉ dùng cho demo** |
| Dashboard 4 vai trò | ⚠️ chạy trên mock data, chưa nối API |
| LiveAnalysis | ✅ nối API thật, nhưng chỉ hiển thị kết quả **post-deploy** |
| Phân quyền theo vai trò ở chế độ Live | ❌ chưa có, ai vào cũng thấy như nhau |
| Auto refresh | ❌ phải bấm nút Làm mới |
| Kết quả pre-merge trên UI | ❌ backend chưa lưu pre-merge vào DB |
| Router | ❌ không dùng react-router; chỉ có hash `#live` |

---

## 10. Xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| Thẻ **"Lỗi kết nối Backend API"** | Kiểm tra backend sống: `curl http://localhost:8000/` |
| `Không có kết quả phân tích cho flow "F1"` | Chạy `POST /runtime` cho flow đó trước |
| Lỗi CORS trong console | Backend phải bật `flask_cors.CORS(app)` và đang chạy |
| Dropdown flow chỉ có `F1` | Bảng `analysis_results` mới có mỗi F1 — chạy thêm flow khác |
| Sửa `.env.local` mà không ăn | Khởi động lại `npm run dev`; Vite chỉ đọc env lúc start |
| Docker build gọi sai backend | Truyền `VITE_API_BASE_URL` vào build arg (xem §7) |
| Vào trang trắng sau khi đăng xuất | Xoá `localStorage` key `qc_portal_auth_token` và `qc_portal_user_profile` |

---

## 11. Repo liên quan

| Repo | Vai trò |
|---|---|
| [agent-review](https://github.com/talent-vds-global/agent-review) | Backend AI Agent sinh ra kết quả mà portal này hiển thị |
| `ewallet-demo` | Hệ thống ví điện tử mẫu sinh trace để phân tích |
