# Café Tycoon

PWA tycoon game quản lý quán cà phê. Built theo `cafe-tycoon-spec.md`.

## Cấu trúc

```
.
├── apps/
│   ├── web/        # Frontend PWA (React + Vite + Tailwind + Zustand + Dexie + PixiJS)
│   └── worker/     # Cloudflare Worker API (Hono + D1 + KV)
├── packages/
│   └── shared/     # Types và constants dùng chung
└── cafe-tycoon-spec.md
```

## Yêu cầu

- Node.js ≥ 20
- pnpm ≥ 9
- (Optional) Wrangler CLI để deploy backend

## Cài đặt

```bash
pnpm install
```

## Chạy frontend (dev)

```bash
pnpm dev
# mở http://localhost:5173
```

Game lưu local vào IndexedDB. Có thể chơi 100% offline.

## Chạy worker (dev)

```bash
# 1) Tạo D1 database (lần đầu)
cd apps/worker
npx wrangler d1 create cafe-tycoon-db
# Cập nhật database_id vào wrangler.toml

# 2) Áp dụng schema
npx wrangler d1 execute cafe-tycoon-db --file=./src/db/schema.sql --local
npx wrangler d1 execute cafe-tycoon-db --file=./src/db/schema.sql --remote

# 3) Tạo KV namespace
npx wrangler kv namespace create cafe-tycoon-kv
# Cập nhật id vào wrangler.toml

# 4) Set JWT secret
npx wrangler secret put JWT_SECRET

# 5) Chạy
pnpm dev:worker
```

## Build production

```bash
pnpm build           # frontend → apps/web/dist
pnpm build:worker    # check worker types
```

## Deploy

- Frontend: deploy `apps/web/dist` lên Cloudflare Pages
- Worker: `pnpm --filter @cafe-tycoon/worker exec wrangler deploy`

## Test

```bash
pnpm test
```

## Tính năng đã có (Phase 1 MVP)

- Game loop 60fps + tick system, speed ×1/×2/×4
- Customer FSM (entering → ordering → eating → leaving)
- Staff AI (barista pha chế, cashier phục vụ, cleaner dọn dẹp, manager đa năng)
- Kitchen prep theo level + fatigue
- Finance: revenue, labor, ingredient, rent, lãi/lỗ hàng ngày
- Reputation: review 1-5 sao, decay nếu vắng khách
- Supply: kho nguyên liệu, restock có giá
- Random events: mưa, ngày lễ, hỏng máy, viral
- IndexedDB auto-save mỗi 30 giây, export/import JSON
- PixiJS floor canvas
- 5 UI panels (Menu, Staff, Finance, Upgrade, Settings)
- Cloudflare Worker API: auth (JWT + PBKDF2), cloud save (conflict detect), leaderboard
- Rate limiting trên KV
- PWA installable, offline-first qua service worker

## License

Private.
