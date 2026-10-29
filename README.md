# agent-review-dashboard

Quality Portal cho [agent-review](https://github.com/talent-vds-global/agent-review): hiển thị kết quả
đối chiếu tài liệu ↔ runtime theo ba mức **hệ thống → service → luồng nghiệp vụ**.

React 19 · TypeScript · Vite 8 · React Router 7 · CSS Modules.

## Bắt đầu nhanh

Cần Node.js 22+. Backend agent-review chạy ở `:8000`.

```bash
npm install
```

```bash
npm run dev
```

Mở `http://localhost:5173`. Màn đăng nhập là giả lập, nhập username/password bất kỳ là vào.

| Lệnh | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Kiểm kiểu + build ra `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run lint` | oxlint |

## Cấu hình

Tạo `.env.local` nếu backend không ở localhost:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_JAEGER_URL=http://localhost:16686
```

Vite nhúng biến này vào lúc **build**. Với Docker, truyền qua biến môi trường hoặc build-arg (địa chỉ
phải gọi được từ trình duyệt của người xem):

```bash
VITE_API_BASE_URL=http://10.0.0.5:8000 docker compose up --build
```

## Màn hình

```text
/login  →  /projects  →  /projects/:id
                         ├─ Tổng quan hệ thống   tiêu chí ĐẠT / CHƯA ĐẠT / CHƯA ĐỦ DỮ LIỆU, lỗi đang bắt, theo service, panel trigger
                         ├─ Một service          các luồng đi qua + vấn đề quy về service đó
                         └─ Báo cáo một luồng    Tổng quan (số liệu trace + kết luận AI) · Đối chiếu tài liệu · Chất lượng DB
```

- Mọi số liệu trong portal là dữ liệu thật từ API. Danh sách dự án ở `/projects` hiện là dữ liệu mẫu
  (`src/data/projects.ts`), dự án nào cũng mở cùng một backend.
- Verdict theo thang **ĐẠT (PASS) / CẦN SỬA (RETRY) / CHUYỂN NGƯỜI XỬ LÝ (ESCALATE)**
  (`screens/LiveAnalysis/verdict.ts`); kết quả cũ mang WARN/FAIL được quy về thang này. Báo cáo một
  luồng hiện lý do của verdict — với RETRY là danh sách vi phạm cần sửa.
- Trace chỉ hiện dưới dạng **số liệu**, không vẽ lại. Muốn xem đủ span thì bấm *Mở trace trong Jaeger*.
- Nút *Lấy trace mới & phân tích* (gọi `POST /runtime`) và panel *Kích hoạt phân tích* (gọi
  `/api/triggers/*`) giúp chạy phân tích ngay trên UI, không phải dùng curl.

API dùng: `/api/overview`, `/api/flows/<id>/analysis`, `/api/flows/<id>/evidence`,
`/api/traces/<id>/metrics`, `/api/db-quality`, `/api/triggers*`, `POST /runtime`. Xem
[`src/services/api.ts`](src/services/api.ts).

## Cấu trúc

```text
src/
├── main.tsx             router: /login, /projects, /projects/:projectId
├── App.tsx              trang một dự án → LiveAnalysis
├── services/api.ts      client gọi agent-review
├── contexts/            AuthContext (đăng nhập giả lập, localStorage)
├── data/                projects.ts (danh sách dự án mẫu), dummy.ts (tài khoản giả lập)
└── screens/
    ├── AuthLogin/       đăng nhập
    ├── ProjectList/     chọn dự án
    └── LiveAnalysis/    portal ba mức (SystemOverview, ServiceDetail, FlowReport, TriggerPanel…)
```

Quy ước: mỗi màn hình gồm `index.tsx` + `use<Tên>.ts` (state) + `<Tên>.module.css`.

## Docker

```bash
docker compose up --build
```

Build bằng Node, phục vụ bằng nginx (SPA fallback) ở `http://localhost:3000`.

## Hạn chế

- Đăng nhập chỉ là giả lập ở client, chưa có backend auth và chưa phân quyền.
- Danh sách dự án là dữ liệu tĩnh, chưa có khái niệm nhiều dự án ở backend.
- `IssueList` báo trùng key React trên console (`F2:error_span:...`).
