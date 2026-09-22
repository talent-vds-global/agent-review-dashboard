# agent-review-dashboard — QC Portal

Web portal hiển thị kết quả đảm bảo chất lượng phần mềm. Mỗi vai trò (Developer / Leader / Tester /
Operator) nhìn cùng một luồng nghiệp vụ nhưng thấy **bằng chứng khác nhau** phù hợp với việc của mình.

Ứng dụng có **hai chế độ**, chuyển qua lại bằng tab ở đầu trang:

| Chế độ | Nguồn dữ liệu | Dùng để |
|---|---|---|
| **Mô phỏng (Mock)** | `src/data/mock.ts` — dữ liệu tĩnh trong repo | Demo trọn vẹn 4 góc nhìn vai trò, không cần backend |
| **Dữ liệu thật (API)** | Backend [agent-review](https://github.com/talent-vds-global/agent-review) | Tổng quan sức khoẻ hệ thống theo service → luồng nghiệp vụ → báo cáo chi tiết kèm bằng chứng từng bước, số liệu trace/log và chất lượng database |

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
        ├── LiveAnalysis/     # Chế độ API thật — portal ba mức
        │   ├── useLiveAnalysis.ts    # Điều hướng 3 mức + nạp dữ liệu theo nhu cầu
        │   └── components/
        │       ├── SystemOverview/   # Mức 1: sức khoẻ hệ thống, tiêu chí đạt/không, lỗi bắt được
        │       ├── MetricCard/       # Một tiêu chí: ĐẠT / CHƯA ĐẠT / CHƯA ĐỦ DỮ LIỆU
        │       ├── IssueList/        # Danh sách lỗi, bấm để mở thẳng bằng chứng
        │       ├── ServiceDetail/    # Mức 2: một service + các luồng đi qua nó
        │       ├── FlowReport/       # Mức 3: báo cáo một luồng, 3 tab
        │       ├── TraceMetricsPanel/# Số liệu trace: thời gian, span, log, NFR, lời gọi lỗi
        │       ├── EvidenceMapping/  # Đối chiếu từng bước tài liệu ↔ dấu vết runtime
        │       └── DbQualityPanel/   # Số liệu db-quality đọc tại thời điểm xem
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
VITE_JAEGER_URL=http://10.0.0.5:16686
```

`VITE_JAEGER_URL` (mặc định `http://localhost:16686`) chỉ dùng cho nút **"Mở trace trong Jaeger"**
ở panel số liệu trace — dành cho ai cần xem đủ 100% span.

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

### Ba mức màn hình

```text
Tổng quan hệ thống  →  Một service  →  Báo cáo một luồng nghiệp vụ
(sức khoẻ + lỗi)       (luồng đi qua)   (3 tab: số liệu + AI, đối chiếu, DB)
```

Breadcrumb trên header đi lại giữa ba mức. Càng vào sâu càng nhiều bằng chứng; mức ngoài cùng chỉ
trả lời "hệ thống có đạt không và đang bắt được lỗi gì".

**Không còn sơ đồ trace.** Trace chỉ xuất hiện ở dạng **số liệu** trong báo cáo của luồng; ai cần
xem đủ 100% span thì bấm *Mở trace trong Jaeger*.

### Điều kiện

Backend [agent-review](https://github.com/talent-vds-global/agent-review) phải đang chạy. Màn tổng
quan hiện được **ngay cả khi chưa có bản ghi nào** (các luồng sẽ ở trạng thái *chưa phân tích*);
muốn có số liệu thì bấm nút **"Lấy trace mới & phân tích"** ngay trong màn báo cáo của luồng —
không cần gọi `POST /runtime` bằng curl nữa.

### Endpoint sử dụng

| Gọi | Lúc nào | Dùng cho |
|---|---|---|
| `GET /api/overview` | mở màn tổng quan | Tiêu chí chất lượng, lỗi đang bắt được, tình trạng từng service |
| `GET /api/overview?db=1` | ngay sau đó (nền) | Bổ sung tiêu chí *Chạy tốt về database?* |
| `GET /api/flows/<flow_id>/analysis` | mở một luồng | Verdict, báo cáo của agent, `trace_id`, bảng đối chiếu đã lưu |
| `GET /api/traces/<trace_id>/metrics` | mở một luồng | Thời gian, span, truy vấn DB, log, lời gọi lỗi |
| `GET /api/flows/<flow_id>/evidence` | bấm *Đối chiếu lại* | Dựng lại bảng đối chiếu theo tài liệu Confluence hiện tại |
| `GET /api/db-quality?services=…` | mở tab *Chất lượng DB* | Số liệu db-quality tại thời điểm xem |
| `POST /runtime` | bấm *Lấy trace mới & phân tích* | Lấy trace mới nhất của luồng từ Jaeger rồi chạy lại đối chiếu + agent |

Tổng quan nạp **hai nhịp**: bản không kèm số liệu DB trả về trong ~0,3s để vẽ màn hình ngay, rồi
bản đầy đủ chèn thêm tiêu chí database — dashboard db-quality của service không chạy thì mỗi lời
gọi phải chờ hết timeout, không nên bắt cả màn hình đợi theo. Dữ liệu của một luồng **chỉ nạp khi
mở đúng luồng đó**, số liệu DB **chỉ nạp khi mở đúng tab đó**.

### Mức 1 — Tổng quan hệ thống

- **Băng trạng thái**: `HỆ THỐNG ĐẠT CHUẨN` / `CÓ VẤN ĐỀ CẦN XEM` / `CÓ VẤN ĐỀ NGHIÊM TRỌNG` /
  `CHƯA ĐỦ DỮ LIỆU`, kèm số luồng đã đối chiếu, số service, số vấn đề.
- **Tiêu chí chất lượng**: mỗi thẻ là một câu hỏi được trả lời bằng số liệu thật, ghi rõ nguồn số
  liệu ở chân thẻ. Ba trạng thái: **ĐẠT**, **CHƯA ĐẠT**, **CHƯA ĐỦ DỮ LIỆU** — trạng thái thứ ba
  là có thật (chưa có trace, chưa đo được NFR) và không được tính là đạt.
- **Lỗi đang bắt được**: bước tài liệu không thấy trong runtime, bước khớp một phần, vi phạm NFR,
  lời gọi lỗi, lời gọi ngoài tài liệu. Bấm một dòng là nhảy thẳng vào luồng + tab chứa bằng chứng.
- **Chất lượng theo service**: mỗi thẻ là một service — verdict của riêng nó (tính trên các vấn đề
  quy về chính nó, không phải verdict xấu nhất của mọi luồng đi qua), số luồng, số vấn đề, điểm DB.

### Mức 2 — Một service

Header: số luồng đã đối chiếu, số vấn đề, verdict. Dải số liệu database của service. Bên dưới là
**các luồng nghiệp vụ đi qua service này** (kể cả luồng chưa phân tích) và **các vấn đề thuộc về
service này**.

### Mức 3 — Báo cáo một luồng (3 tab)

| Tab | Nội dung |
|---|---|
| **Tổng quan** | Số liệu luồng trace + kết luận Markdown của agent |
| **Đối chiếu tài liệu** | Bảng từng bước §2.3 của trang Confluence ↔ dấu vết trong trace; bảng NFR có số đo thật; bảng rule |
| **Chất lượng DB** | Điểm, p50/p95/p99, số câu SQL, nghi vấn N+1, phát hiện và câu lệnh gọi nhiều nhất của từng service |

**Tab Tổng quan**

- **Panel trái — Số liệu luồng trace**: tổng thời gian, số span thu được, số bước nghiệp vụ, số
  service tham gia, số truy vấn DB, số NFR đạt, số lời gọi lỗi, **số dòng log thu được** (đếm theo
  `trace_id` trong Loki). Bên dưới: bảng NFR (đo được vs ngưỡng), nơi tốn thời gian nhất, danh sách
  lời gọi báo lỗi, và **các dòng log lỗi của chính giao dịch này** kèm link mở trong Grafana.
- **Panel phải — Kết luận phân tích**: render `detail` bằng `react-markdown`, phía trên là dòng
  tóm tắt số bước khớp / thiếu / NFR vi phạm để đối chiếu nhanh với tab bằng chứng.

**Tab Đối chiếu tài liệu**

- Mỗi dòng là một bước trong tài liệu. Bấm vào dòng để mở hai cột: *dấu vết cần có* (theo file ánh
  xạ) và *bằng chứng thu được* (span nào, service nào, bao nhiêu ms, câu SQL gì).
- **Bước đúng cũng có bằng chứng** — không chỉ bước thiếu.
- Bộ lọc: tất cả / chỉ bước có vấn đề / chỉ bước đã khớp.
- Trạng thái: `Khớp` · `Khớp một phần` · `Thiếu` · `Không quan sát được` (bước không để lại span,
  vd validate trong bộ nhớ) · `Ngoài nhánh` (nhánh thực tế không đi qua, vd saga dừng ở S2 khi HELD).
- Nút **Đối chiếu lại theo tài liệu mới nhất** dựng lại bảng từ Confluence hiện tại mà **không** gọi
  LLM — dùng khi vừa sửa tài liệu.

**Tab Chất lượng DB**

- Số liệu đọc trực tiếp từ dashboard của `database-quality-library` (Topic #80) **tại thời điểm mở
  tab**, không lưu lịch sử — mỗi lần bấm *Đọc lại số liệu* là một lần đo mới.
- Chỉ hỏi những service có truy vấn DB trong trace đang xem.

**Nút "Lấy trace mới & phân tích"**

- Nằm ở thanh thông tin của luồng, và cả trong thẻ báo *chưa có báo cáo* — dùng để sinh kết quả
  đầu tiên cho một luồng chưa từng phân tích.
- Gọi `POST /runtime` với `flow_id` của luồng: backend tự tìm **trace mới nhất của đúng luồng đó**
  trong Jaeger, đối chiếu tài liệu rồi gọi agent. Mất **vài chục giây** (có một lần gọi LLM) nên
  nút bị khoá trong lúc chạy và có một dòng trạng thái báo đang chạy.
- Xong thì tự nạp lại báo cáo của luồng **và** số liệu màn tổng quan, kèm một dòng báo trace nào
  vừa được phân tích + verdict. Jaeger không có trace của luồng thì hiện lý do, không lưu gì.

**Chung**

- **Badge verdict**: `PASS` (✓ xanh) / `WARN` (⚠ vàng) / `FAIL` (✕ đỏ).
- **Nút Làm mới**: đọc lại toàn bộ số liệu tổng quan. Không có auto-refresh — phải bấm tay.
- Thời gian format theo múi giờ `Asia/Ho_Chi_Minh`.

### Khi lỗi

Thẻ lỗi hiện thông báo từ backend kèm URL đang gọi và nút **Thử lại ngay**. Nguyên nhân hay gặp:
backend chưa chạy hoặc CORS. Luồng chưa từng phân tích thì báo cáo hiện hướng dẫn chạy
`POST /runtime`; Jaeger/Loki không chạy thì chỉ phần số liệu trace/log báo lỗi, các phần còn lại
vẫn hiện đủ.

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
| Bảng đối chiếu tài liệu ↔ runtime | ✅ có, kèm bằng chứng cho cả bước đúng lẫn bước thiếu |
| Tổng quan theo service | ✅ có, gộp từ `GET /api/overview`; luồng chưa phân tích vẫn hiện (trạng thái *chưa phân tích*) |
| Số liệu trace + log của một luồng | ✅ có; bản ghi cũ không có `trace_id` thì panel này báo thiếu dữ liệu |
| Sơ đồ trace (biểu đồ thác nước) | ❌ đã bỏ khỏi dashboard — cần xem thì mở Jaeger |
| Số liệu DB | ✅ đọc tại thời điểm xem; ❌ không có lịch sử để so sánh theo thời gian |
| Chạy phân tích mới từ UI | ✅ nút *Lấy trace mới & phân tích* trong màn báo cáo của luồng |
| Chạy phân tích cho nhiều luồng một lượt | ❌ phải mở từng luồng bấm nút |
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
| Luồng hiện *chưa phân tích* | Chưa có bản ghi trong `analysis_results` — chạy `POST /runtime` cho flow đó |
| Tab *Đối chiếu tài liệu* báo "chưa có bảng đối chiếu" | Bản ghi tạo trước khi có tính năng này — chạy lại `POST /runtime` hoặc bấm *Đối chiếu lại ngay* |
| Panel *Số liệu luồng trace* báo thiếu `trace_id` | Bản ghi cũ (hoặc phân tích từ raw log) không gắn trace — chạy lại `POST /runtime` với trace thật |
| Ô *Dòng log thu được* hiện `—` | Loki chưa chạy hoặc backend cấu hình sai `LOKI_URL` (mặc định `http://localhost:13100`) |
| Tiêu chí *Chạy tốt về database?* luôn *chưa đủ dữ liệu* | Không dashboard db-quality nào đọc được (cổng 19082–19085) |
| Tab *Chất lượng DB* báo không đọc được | Dashboard db-quality của service đó chưa chạy (cổng 19082–19085) hoặc backend cấu hình sai `DB_QUALITY_URLS` |
| Sửa `.env.local` mà không ăn | Khởi động lại `npm run dev`; Vite chỉ đọc env lúc start |
| Docker build gọi sai backend | Truyền `VITE_API_BASE_URL` vào build arg (xem §7) |
| Vào trang trắng sau khi đăng xuất | Xoá `localStorage` key `qc_portal_auth_token` và `qc_portal_user_profile` |

---

## 11. Repo liên quan

| Repo | Vai trò |
|---|---|
| [agent-review](https://github.com/talent-vds-global/agent-review) | Backend AI Agent sinh ra kết quả mà portal này hiển thị |
| `ewallet-demo` | Hệ thống ví điện tử mẫu sinh trace để phân tích |
