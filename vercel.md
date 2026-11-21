# HƯỚNG DẪN TRIỂN KHAI WEB APP TRÊN VERCEL + SUPABASE (100% FREE TIER)

Tài liệu hướng dẫn chi tiết từng bước để triển khai ứng dụng **Equilibria (Mind Anchor)** từ kho mã nguồn GitHub [`nhat-vien/cognitive-toolkit`](https://github.com/nhat-vien/cognitive-toolkit) lên **Vercel** và kết nối cơ sở dữ liệu **Supabase (`PostgreSQL 16 + pgvector + RLS`)**.

---

## Bước 1: Thiết lập Cấu hình Build trên Vercel (Màn hình `Configure Project`)

Sau khi đã bấm **Import** repo `nhat-vien/cognitive-toolkit` vào Vercel, vì đây là một **Monorepo** (ứng dụng Web nằm tại `apps/web-nextjs`), bạn có thể chọn **1 trong 2 cách** dưới đây:

### Cách A (Khuyên dùng nhất — Đặt `Root Directory` là `apps/web-nextjs`)
1. **Framework Preset:** Chọn **`Next.js`**
2. **Root Directory:** Bấm nút **Edit** → Chọn thư mục **`apps/web-nextjs`** → Bấm **Continue**.
3. **Build and Output Settings:** Để toàn bộ ở chế độ **Mặc định (Default)** của Next.js:
   - **Build Command:** `next build` *(hoặc để công tắc Override tắt)*
   - **Output Directory:** `.next` *(hoặc để công tắc Override tắt)*
   - **Install Command:** `npm install` *(hoặc để công tắc Override tắt)*

### Cách B (Giữ nguyên `Root Directory` ở thư mục gốc `./`)
Nếu bạn để `Root Directory` ở thư mục gốc `./`, file [`vercel.json`](./vercel.json) trong repo sẽ tự động điều hướng Vercel chạy theo cấu hình Workspace:
- **Build Command:** `npm run build --workspace=@cognitive-toolkit/web-nextjs`
- **Output Directory:** `apps/web-nextjs/.next`
- **Install Command:** `npm install`

---

## Bước 2: Cấu hình Biến Môi trường (`Environment Variables`)

Mở mục **Environment Variables** trên màn hình Vercel. Bạn có thể chọn 1 trong 2 chế độ:

### Chế độ 1: Deploy chạy thử ngay lập tức (Chưa cần tạo Supabase)
Ứng dụng được thiết kế theo kiến trúc **Local-First + Zero-Dependency Edge Fallback** (`apps/web-nextjs/src/lib/supabase-edge.ts`). Do đó, kể cả khi bạn **để trống hoàn toàn** các biến Supabase, ứng dụng vẫn build và chạy 100% tính năng (lưu trữ mã hóa AES-GCM-256 trên trình duyệt + Grounded RAG tích hợp sẵn trên Edge).

Bạn chỉ cần thêm 1 biến tùy chọn (hoặc bấm **Deploy** luôn):

| Key (Tên biến) | Value (Giá trị) |
| :--- | :--- |
| `RAG_SCORE_THRESHOLD` | `0.46` |

---

### Chế độ 2: Kết nối Full-Stack với Supabase Free Tier (`PostgreSQL 16 + pgvector + E2EE Sync`)

1. Truy cập [https://supabase.com](https://supabase.com) → Đăng nhập và tạo một Project mới (**Free Tier**).
2. Vào menu **SQL Editor** ở thanh bên trái → Bấm **New Query**.
3. Mở file [`supabase/migrations/0001_equilibria_schema_rls_pgvector.sql`](./supabase/migrations/0001_equilibria_schema_rls_pgvector.sql), copy toàn bộ nội dung dán vào khung SQL Editor và bấm **Run** để khởi tạo:
   - Tiện ích mở rộng `vector` (`pgvector`), `pgcrypto`, `uuid-ossp`.
   - Bảng đồng bộ mã hóa đầu cuối `public.e2ee_sync_blobs` kèm chính sách **Row-Level Security (RLS)** (`auth.uid() = user_id`).
   - Bảng lưu trạng thái phiên `public.session_checkpoints`, chuỗi kiểm toán băm `public.safety_audit_logs`, hàng đợi cảnh báo `public.outbox_events`, và liên kết chia sẻ báo cáo bác sĩ `public.clinician_share_links`.
   - Bảng kho tri thức lâm sàng `public.clinical_kb_chunks` và hàm RPC `public.match_clinical_kb_chunks` (ngưỡng `0.46`).
4. Vào **Project Settings (biểu tượng bánh răng) → API** trên Supabase để lấy `Project URL` và `anon public key`, sau đó điền vào mục **Environment Variables** trên Vercel:

| Key (Tên biến) | Value (Giá trị) | Ghi chú |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | URL dự án Supabase của bạn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Khóa `anon` `public` trong mục API của Supabase |
| `RAG_SCORE_THRESHOLD` | `0.46` | Ngưỡng từ chối nghiêm ngặt của Grounded RAG (100% Abstention dưới `0.46`) |

*(Nếu sau khi đã bấm Deploy bạn mới thêm các biến này trong mục **Project Settings → Environment Variables** của Vercel, hãy vào tab **Deployments** → bấm dấu `...` ở bản build mới nhất → chọn **Redeploy** để áp dụng).*

---

## Bước 3: Kiểm tra Nghiệm thu Sau khi Deploy Thành công

Sau khi Vercel hoàn tất quá trình build và cấp tên miền (ví dụ: `https://cognitive-toolkit-xxxx.vercel.app`), bạn hãy kiểm tra 4 đường dẫn sau:

1. **Giao diện Ứng dụng Web & Cổng Bác sĩ:**
   - URL: `https://<ten-mien-vercel-cua-ban>.vercel.app/`
   - Kiểm tra nút **SOS 1 chạm** (Thở dẫn nhịp 4-6 / 4-7-8 với âm thanh Web Audio 100% offline, DBT `TIPP` có sàng lọc y khoa trước bước nước lạnh), 3 giao diện thích ứng (*Standard*, *Trầm cảm nặng $\le -3$*, *Hưng cảm nhẹ $\ge +2$*), 7 phác đồ CBT/DBT có Socratic Pushback, *Hộp Lo âu (Worry Box)*, *Biểu đồ Lưỡng cực $-5..+5$*, *Khoang chờ 48h (48h Impulse Vault)* và *Báo cáo Bác sĩ in A4*.

2. **Kiểm tra API Trạng thái Kho Tri thức Grounded RAG:**
   - URL: `https://<ten-mien-vercel-cua-ban>.vercel.app/api/v1/knowledge`
   - Kết quả trả về JSON hiển thị `status: "ready"`, `ragThreshold: 0.46` và `deploymentMode`.

3. **Kiểm tra API Truy xuất Phác đồ Lâm sàng (`Recall >= 0.46` & `100% Abstention`):**
   - Truy vấn trong phạm vi CBT/DBT:
     `https://<ten-mien-vercel-cua-ban>.vercel.app/api/v1/knowledge?q=tipp`
     → Trả về `abstained: false`, đoạn hướng dẫn DBT TIPP kèm trích dẫn `[KB:tipp#medical-screening]`.
   - Truy vấn ngoài phạm vi y khoa:
     `https://<ten-mien-vercel-cua-ban>.vercel.app/api/v1/knowledge?q=chung-khoan`
     → Trả về `abstained: true`, từ chối bịa phác đồ và chuyển sang phản hồi thấu cảm TEAM-CBT EAR.

4. **Kiểm tra API Đồng bộ E2EE & Chuỗi Kiểm toán An toàn (SHA-256 Audit Chain):**
   - URL: `https://<ten-mien-vercel-cua-ban>.vercel.app/api/v1/sync?user_id=anon-patient`
   - Đây cũng là endpoint để ứng dụng di động **Flutter (`apps/mobile-flutter`)** đồng bộ dữ liệu mã hóa đầu cuối với phiên bản Web.
