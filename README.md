# Equilibria (Mind Anchor) — Multi-Platform CBT, TEAM-CBT, DBT & IPSRT Clinical Ecosystem

Hệ sinh thái ứng dụng đa nền tảng (**Flutter** cho Android/iOS + **TypeScript / Next.js 15** cho Web & Clinician Portal + **Supabase / FastAPI Modular Monolith**) hỗ trợ người bệnh **Rối loạn Lo âu**, **Trầm cảm** và **Rối loạn Lưỡng cực**.

## Tài liệu Đặc tả & Kế hoạch Triển khai
- **[SPEC.md](./SPEC.md)**: Đặc tả Kỹ thuật & Lâm sàng toàn diện (Tổng hợp từ 7 repo nền tảng, kiến trúc lõi CBT/TEAM-CBT & DBT, định tuyến *"DBT-First, CBT-Second"*, bộ công cụ tiêu chuẩn vàng cho Lo âu, Trầm cảm và Lưỡng cực IPSRT).
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)**: Kế hoạch triển khai chi tiết 16 tuần / 8 Sprints.

## Cấu trúc Monorepo
- `packages/clinical-protocols-kb/`: 16 phác đồ lâm sàng Markdown song ngữ (Việt - Anh) với YAML frontmatter & vùng Socratic Pushback + bộ kiểm định RAG `evals/rag_retrieval.json`.
- `packages/clinical-core-ts/`: Lõi TypeScript không phụ thuộc (Zero-dependency) gồm 0ms Deterministic Distortion/SDB/Safety Detector, 5-Phase Session State Machine, 4-Level Socratic Pushback, 6 thang đo lâm sàng (`BMS`, `PHQ-9`, `GAD-7`, `ASRM`, `MDQ`, `ISI`), và Bipolar IPSRT / Baseline-Relative HRV Engine.
- `apps/web-nextjs/`: Ứng dụng Web & Clinician Portal (Next.js 15 / React 19 / TypeScript) với 3 giao diện thích ứng (*Standard*, *Low-Energy Depression*, *Low-Stimulus Mania*), Cổng SOS DBT 1 chạm (Web Audio offline), 7 giao thức tương tác, *Worry Box*, *Exposure Hierarchy*, *48h Impulse Vault*, mã hóa WebCrypto AES-GCM-256 và Serverless API Routes tương thích **Vercel + Supabase Free Tier**.
- `apps/mobile-flutter/`: Ứng dụng di động Flutter (Android & iOS) với `Riverpod`, mã hóa `SQLCipher AES-256`, cầu nối `HealthKit / Health Connect` (HRV & Sleep baseline), Haptic Breathing và Voice Burst Journal.
- `apps/backend-api/`: Python FastAPI Modular Monolith với Grounded RAG (`threshold = 0.46`, `Abstention Accuracy = 100%`), 4-Layer Safety Gate, `Transactional Outbox Worker`, Zero-Knowledge E2EE Sync và chuỗi kiểm toán `SHA-256 Hash-Chained Audit Log`.
- `supabase/migrations/0001_equilibria_schema_rls_pgvector.sql`: Script SQL một chạm khởi tạo PostgreSQL 16 + `pgvector` + Row-Level Security (RLS) trên Supabase.

## Kiểm thử Tự động (Automated Verification)
```bash
# 1. TypeScript Clinical Core (22 tests)
node --test packages/clinical-core-ts/tests/clinical-core.test.ts

# 2. Next.js Web & Vercel-Supabase Serverless Stack (7 test suites)
node --test apps/web-nextjs/tests/web-clinical-app.test.ts

# 3. Python FastAPI Modular Monolith & Grounded RAG (4 E2E suites)
python -m unittest discover -s apps/backend-api/tests -v
```
