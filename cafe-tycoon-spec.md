# Café Tycoon PWA — Full Project Specification

> Tài liệu này dành cho Claude Code. Đọc toàn bộ trước khi bắt đầu code bất kỳ file nào.

---

## 1. Tổng quan dự án

Game mô phỏng quản lý quán cà phê dạng **Progressive Web App (PWA)**. Người chơi xây dựng và vận hành quán từ quy mô nhỏ đến chuỗi nhiều chi nhánh. Game chạy offline hoàn toàn nhờ IndexedDB, đồng bộ cloud qua Cloudflare Workers khi có mạng.

**Thể loại:** Tycoon / Idle / Management Simulation  
**Platform:** PWA (Web, installable trên mobile & desktop)  
**Ngôn ngữ:** Tiếng Việt (UI) + English (code)

---

## 2. Tech Stack

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Bundler + dev server |
| `vite-plugin-pwa` | latest | Service Worker, Web App Manifest |
| Zustand | 4.x | Game state (runtime) |
| Immer | 10.x | Immutable state updates |
| Dexie.js | 3.x | IndexedDB wrapper (local save) |
| TanStack Query | 5.x | Server sync, background fetch |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 11.x | Animations, game feel |
| PixiJS | 7.x | Canvas rendering (game viewport/floor map) |
| shadcn/ui | latest | UI components (menus, dialogs, panels) |

### Backend (Cloudflare)
| Công nghệ | Mục đích |
|---|---|
| Cloudflare Workers | API runtime |
| Cloudflare D1 | SQLite database (cloud save, leaderboard) |
| Cloudflare KV | Session tokens, rate limit counters |
| Hono.js | Router framework trên Workers |

### Tooling
- **pnpm** — package manager
- **Vitest** — unit tests
- **Wrangler CLI** — deploy Cloudflare Workers
- **Biome** — linter + formatter (thay ESLint/Prettier)

---

## 3. Cấu trúc thư mục

```
cafe-tycoon/
├── apps/
│   ├── web/                        # Frontend PWA
│   │   ├── public/
│   │   │   ├── icons/              # PWA icons (192x192, 512x512, maskable)
│   │   │   └── manifest.json       # Web App Manifest
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── game/
│   │   │   │   ├── engine/
│   │   │   │   │   ├── GameLoop.ts         # requestAnimationFrame loop
│   │   │   │   │   ├── Scheduler.ts        # Event queue & tick system
│   │   │   │   │   └── TimeManager.ts      # In-game time, offline calc
│   │   │   │   ├── simulation/
│   │   │   │   │   ├── CustomerAI.ts       # Customer behavior FSM
│   │   │   │   │   ├── StaffAI.ts          # Staff pathfinding & tasks
│   │   │   │   │   ├── OrderQueue.ts       # Order management
│   │   │   │   │   └── KitchenSimulator.ts # Prep time, capacity
│   │   │   │   ├── systems/
│   │   │   │   │   ├── FinanceSystem.ts    # Revenue, expenses, P&L
│   │   │   │   │   ├── ReputationSystem.ts # Customer reviews, score
│   │   │   │   │   ├── SupplySystem.ts     # Inventory, suppliers
│   │   │   │   │   └── EventSystem.ts      # Random events, seasons
│   │   │   │   └── constants/
│   │   │   │       ├── recipes.ts
│   │   │   │       ├── customerTypes.ts
│   │   │   │       └── staffRoles.ts
│   │   │   ├── store/
│   │   │   │   ├── useGameStore.ts         # Main Zustand store
│   │   │   │   ├── useUIStore.ts           # UI state (modals, panels)
│   │   │   │   └── slices/
│   │   │   │       ├── cafeSlice.ts
│   │   │   │       ├── staffSlice.ts
│   │   │   │       ├── menuSlice.ts
│   │   │   │       └── financeSlice.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts               # Dexie DB schema
│   │   │   │   ├── migrations.ts           # DB version migrations
│   │   │   │   └── saveManager.ts          # Auto-save, export/import
│   │   │   ├── api/
│   │   │   │   ├── client.ts               # Fetch wrapper
│   │   │   │   ├── auth.ts                 # Login, register
│   │   │   │   ├── cloudSave.ts            # Push/pull save
│   │   │   │   └── leaderboard.ts
│   │   │   ├── render/
│   │   │   │   ├── FloorCanvas.tsx         # PixiJS viewport
│   │   │   │   ├── sprites/
│   │   │   │   └── animations/
│   │   │   ├── components/
│   │   │   │   ├── hud/
│   │   │   │   │   ├── TopBar.tsx          # Cash, day, reputation
│   │   │   │   │   ├── BottomNav.tsx       # Tab navigation
│   │   │   │   │   └── Notifications.tsx
│   │   │   │   ├── panels/
│   │   │   │   │   ├── MenuPanel.tsx
│   │   │   │   │   ├── StaffPanel.tsx
│   │   │   │   │   ├── FinancePanel.tsx
│   │   │   │   │   └── UpgradePanel.tsx
│   │   │   │   └── modals/
│   │   │   ├── screens/
│   │   │   │   ├── GameScreen.tsx          # Main game view
│   │   │   │   ├── MainMenuScreen.tsx
│   │   │   │   └── LeaderboardScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useGameLoop.ts
│   │   │   │   ├── useAutoSave.ts
│   │   │   │   └── useOfflineSync.ts
│   │   │   └── utils/
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── worker/                     # Cloudflare Worker
│       ├── src/
│       │   ├── index.ts            # Entry point, Hono app
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── save.ts
│       │   │   └── leaderboard.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts         # JWT validation
│       │   │   └── rateLimit.ts    # KV-based rate limiting
│       │   ├── db/
│       │   │   ├── schema.sql      # D1 schema
│       │   │   └── queries.ts      # Typed D1 queries
│       │   └── types.ts
│       ├── wrangler.toml
│       └── package.json
├── packages/
│   └── shared/                     # Types dùng chung FE + BE
│       ├── src/
│       │   ├── types/
│       │   │   ├── game.ts         # GameState, SaveData types
│       │   │   ├── api.ts          # Request/Response types
│       │   │   └── entities.ts     # Staff, MenuItem, Customer...
│       │   └── constants/
│       │       └── gameConfig.ts   # Shared game constants
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Database Schema

### 4.1 IndexedDB (Dexie.js) — Local, `apps/web/src/db/schema.ts`

```typescript
import Dexie, { type Table } from 'dexie'

// Types
export interface SaveSlot {
  id?: number
  slotName: string
  cafeName: string
  createdAt: number
  updatedAt: number
  playtimeSeconds: number
  cloudSynced: boolean
  cloudSaveId?: string
}

export interface GameStateRecord {
  saveId: number           // FK → SaveSlot.id
  cash: number
  day: number              // In-game day number
  gameTimeMs: number       // In-game elapsed ms
  realTimeMs: number       // Real world time when last saved
  reputation: number       // 0–100
  totalCustomersServed: number
  totalRevenue: number
  unlockedFeatures: string // JSON array of feature keys
}

export interface StaffRecord {
  id?: number
  saveId: number
  name: string
  role: 'barista' | 'cashier' | 'cleaner' | 'manager'
  level: number            // 1–10
  experience: number
  fatigue: number          // 0–100, resets daily
  salary: number           // per in-game day
  hiredAt: number          // in-game day
  mood: number             // 0–100, affects performance
}

export interface MenuItemRecord {
  id?: number
  saveId: number
  name: string
  category: 'coffee' | 'tea' | 'food' | 'dessert'
  price: number
  baseCost: number         // ingredient cost
  prepTimeSeconds: number  // in-game seconds
  isAvailable: boolean
  unlocked: boolean
  salesCount: number
}

export interface InventoryRecord {
  id?: number
  saveId: number
  ingredientId: string     // references constants/ingredients
  quantity: number         // in grams or units
  lastRestockedAt: number  // in-game day
}

export interface FinancialRecord {
  id?: number
  saveId: number
  day: number
  revenue: number
  laborCost: number
  ingredientCost: number
  rentCost: number
  otherExpenses: number
  profit: number
  customersServed: number
  averageRating: number
}

export interface CustomerReviewRecord {
  id?: number
  saveId: number
  day: number
  customerType: string
  rating: number           // 1–5
  comment: string
  waitTime: number         // seconds
}

export interface FloorLayoutRecord {
  saveId: number           // 1:1 with SaveSlot
  layoutJson: string       // JSON: array of placed furniture objects
  tableCount: number
  seatingCapacity: number
  vibeScore: number        // 0–100, affects customer happiness
}

// Dexie DB class
export class CafeTycoonDB extends Dexie {
  saveSlots!: Table<SaveSlot>
  gameStates!: Table<GameStateRecord>
  staff!: Table<StaffRecord>
  menuItems!: Table<MenuItemRecord>
  inventory!: Table<InventoryRecord>
  financials!: Table<FinancialRecord>
  reviews!: Table<CustomerReviewRecord>
  floorLayouts!: Table<FloorLayoutRecord>

  constructor() {
    super('CafeTycoonDB')
    this.version(1).stores({
      saveSlots:    '++id, updatedAt, cloudSaveId',
      gameStates:   'saveId',
      staff:        '++id, saveId, role',
      menuItems:    '++id, saveId, category, isAvailable',
      inventory:    '++id, saveId, ingredientId',
      financials:   '++id, saveId, day',
      reviews:      '++id, saveId, day',
      floorLayouts: 'saveId',
    })
  }
}

export const db = new CafeTycoonDB()
```

### 4.2 Cloudflare D1 (SQLite) — `apps/worker/src/db/schema.sql`

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- nanoid
  username    TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE,
  password_hash TEXT,                    -- null nếu dùng OAuth
  created_at  INTEGER NOT NULL,
  last_login  INTEGER
);

-- Cloud saves (1 user có thể có nhiều save slots)
CREATE TABLE IF NOT EXISTS cloud_saves (
  id          TEXT PRIMARY KEY,          -- nanoid
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_name   TEXT NOT NULL,
  cafe_name   TEXT NOT NULL,
  save_data   TEXT NOT NULL,             -- JSON blob của toàn bộ save
  checksum    TEXT NOT NULL,             -- SHA-256 để detect conflicts
  client_updated_at INTEGER NOT NULL,   -- timestamp từ client
  server_updated_at INTEGER NOT NULL,   -- timestamp server nhận
  play_time_seconds INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL
);

-- Chỉ giữ 3 save slots per user
CREATE INDEX IF NOT EXISTS idx_cloud_saves_user ON cloud_saves(user_id, server_updated_at DESC);

-- Leaderboard entries (snapshot daily)
CREATE TABLE IF NOT EXISTS leaderboard (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  cafe_name   TEXT NOT NULL,
  score_type  TEXT NOT NULL,            -- 'revenue_7d' | 'reputation' | 'days_survived'
  score_value INTEGER NOT NULL,
  recorded_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type_score ON leaderboard(score_type, score_value DESC);

-- Sessions (stored in KV, bảng này chỉ để audit)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  ip_address  TEXT
);
```

---

## 5. Game State (Zustand) — `apps/web/src/store/useGameStore.ts`

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Staff, MenuItem, Customer, GameConfig } from '@cafe-tycoon/shared'

export interface GameState {
  // Core
  isRunning: boolean
  isPaused: boolean
  speed: 1 | 2 | 4           // game speed multiplier

  // Economy
  cash: number
  debt: number
  day: number
  hour: number               // 0–23 in-game
  minute: number

  // Cafe
  cafeName: string
  reputation: number         // 0–100
  vibeScore: number          // từ floor layout
  seatingCapacity: number

  // Entities (runtime only, not persisted directly)
  customers: Customer[]      // active in-cafe customers
  staff: Staff[]
  menuItems: MenuItem[]
  orderQueue: Order[]

  // Stats (today)
  todayRevenue: number
  todayCustomers: number
  todayRating: number        // rolling avg

  // Actions
  tick: (deltaMs: number) => void
  pause: () => void
  resume: () => void
  setSpeed: (speed: 1 | 2 | 4) => void
  addCash: (amount: number) => void
  spendCash: (amount: number) => boolean
  hireStaff: (staff: Staff) => void
  fireStaff: (staffId: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  addCustomer: (customer: Customer) => void
  removeCustomer: (customerId: string) => void
  processOrder: (orderId: string) => void
}
```

---

## 6. API Endpoints (Cloudflare Worker)

Base URL: `https://api.cafe-tycoon.workers.dev`  
Framework: **Hono.js**

### 6.1 Auth

```
POST   /auth/register
  Body: { username, email, password }
  Response: { userId, token, expiresAt }

POST   /auth/login
  Body: { email, password }
  Response: { userId, token, expiresAt }

POST   /auth/logout
  Header: Authorization: Bearer <token>
  Response: { success: true }

GET    /auth/me
  Header: Authorization: Bearer <token>
  Response: { userId, username, email }
```

### 6.2 Cloud Save

```
GET    /save
  Header: Authorization: Bearer <token>
  Response: SaveSlot[]

GET    /save/:saveId
  Response: { saveId, saveData, checksum, updatedAt }

POST   /save
  Body: { slotName, cafeName, saveData, checksum, clientUpdatedAt }
  Response: { saveId, serverUpdatedAt }
  Note: Max 3 slots per user. Trả 409 nếu checksum conflict.

PUT    /save/:saveId
  Body: { saveData, checksum, clientUpdatedAt }
  Response: { serverUpdatedAt }
  Conflict resolution: nếu clientUpdatedAt < server's client_updated_at → 409 với server version

DELETE /save/:saveId
  Response: { success: true }
```

**Conflict Resolution Strategy:**
- Client gửi `clientUpdatedAt` (timestamp khi save trên client).
- Nếu server có bản mới hơn (`client_updated_at` > request's `clientUpdatedAt`) → trả 409 kèm server version.
- Client hiển thị dialog: "Tìm thấy save mới hơn trên server. Dùng bản nào?"
- Người chơi chọn → client thắng hoặc server thắng.

### 6.3 Leaderboard

```
GET    /leaderboard/:scoreType?limit=50&offset=0
  scoreType: 'revenue_7d' | 'reputation' | 'days_survived'
  Response: { entries: LeaderboardEntry[], total: number }

POST   /leaderboard
  Header: Authorization: Bearer <token>
  Body: { scoreType, scoreValue, cafeName }
  Response: { rank: number }
```

### 6.4 Middleware

**Rate Limiting (KV-based):**
- `/auth/register`: 5 requests / IP / hour
- `/auth/login`: 10 requests / IP / 15 minutes
- `/save` (POST/PUT): 30 requests / user / minute
- `/leaderboard` (POST): 5 requests / user / hour

**JWT Auth:**
- Token lifetime: 30 ngày
- Lưu token hash trong KV với TTL = 30 ngày
- KV key pattern: `session:{tokenHash}`

---

## 7. PWA Configuration — `apps/web/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Café Tycoon',
        short_name: 'Café Tycoon',
        description: 'Xây dựng chuỗi cà phê đế chế của bạn',
        theme_color: '#4A3728',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache static assets, game assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache API responses (leaderboard)
            urlPattern: /^https:\/\/api\.cafe-tycoon\.workers\.dev\/leaderboard/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-leaderboard',
              expiration: { maxAgeSeconds: 300 }, // 5 min
            },
          },
        ],
      },
    }),
  ],
})
```

---

## 8. Auto-Save & Sync Flow — `apps/web/src/db/saveManager.ts`

```typescript
// Logic cần implement:

// 1. AUTO-SAVE (mỗi 30 giây real-time)
//    - Lấy toàn bộ state từ Zustand
//    - Serialize thành SaveData object
//    - Upsert vào IndexedDB (Dexie)
//    - Mark cloudSynced = false

// 2. CLOUD SYNC (khi có mạng, mỗi 5 phút hoặc khi tab focus)
//    - Lấy tất cả save có cloudSynced = false
//    - Gọi PUT /save/:saveId
//    - Nếu 409: hiển thị conflict dialog
//    - Nếu thành công: mark cloudSynced = true

// 3. LOAD GAME (khi khởi động)
//    - Load từ IndexedDB trước (instant)
//    - Background: check cloud có bản mới hơn không
//    - Nếu có: hiển thị banner "Tìm thấy save trên cloud, bạn muốn dùng không?"

// 4. EXPORT/IMPORT
//    - Export: serialize IndexedDB → JSON file download
//    - Import: parse JSON → validate schema → upsert vào IndexedDB

// Offline progress calculation (khi mở game sau thời gian vắng mặt):
// realTimePassed = Date.now() - gameState.realTimeMs
// maxOfflineMinutes = 480 (8 giờ game time tối đa)
// effectiveMinutes = min(realTimePassed / 1000 / 60, maxOfflineMinutes)
// Chạy nhanh simulation để tính revenue từ offline time
```

---

## 9. Core Game Loop — `apps/web/src/game/engine/GameLoop.ts`

```typescript
// Game chạy ở 60 FPS (requestAnimationFrame)
// 1 in-game minute = 1 real-time second ở speed x1
// → 1 in-game ngày (16h mở cửa) = 16 real giây ở x1, 4 giây ở x4

// TICK ORDER (mỗi frame):
// 1. TimeManager.advance(deltaMs * speed)
// 2. CustomerAI.tick()      — spawn khách mới, update hành vi từng khách
// 3. StaffAI.tick()         — assign tasks, move staff, complete orders
// 4. KitchenSimulator.tick() — process order queue
// 5. FinanceSystem.tick()   — collect payment khi khách ra
// 6. ReputationSystem.tick() — update satisfaction scores
// 7. EventSystem.tick()     — check random event triggers
// 8. SupplySystem.tick()    — consume inventory
// 9. Render (PixiJS stage update)

// CUSTOMER SPAWN RATE (per in-game minute):
// base_rate = reputation / 20 + seating_capacity / 10
// modifier từ: thời điểm trong ngày (peak 7-9am, 12-1pm, 5-7pm)
//              thời tiết (rain event giảm 30%)
//              ngày trong tuần
//              đang có event hay không

// STAFF FATIGUE:
// Tăng 1 point / 30 in-game phút khi làm việc
// Khi fatigue > 80: tốc độ làm việc giảm 40%
// Khi fatigue > 95: có 10% chance từ chối task
// Reset về 0 khi bắt đầu ngày mới (openingTime)
```

---

## 10. Wrangler Config — `apps/worker/wrangler.toml`

```toml
name = "cafe-tycoon-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "cafe-tycoon-db"
database_id = "YOUR_D1_DATABASE_ID"   # thay bằng ID thật sau khi tạo

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"           # thay bằng ID thật

[vars]
JWT_SECRET = "REPLACE_WITH_SECRET"    # dùng wrangler secret put JWT_SECRET thay thế
ALLOWED_ORIGIN = "https://cafe-tycoon.pages.dev"

[env.dev]
[env.dev.vars]
ALLOWED_ORIGIN = "http://localhost:5173"
```

---

## 11. Shared Types — `packages/shared/src/types/entities.ts`

```typescript
export type StaffRole = 'barista' | 'cashier' | 'cleaner' | 'manager'

export interface Staff {
  id: string
  name: string
  role: StaffRole
  level: number          // 1–10
  experience: number
  fatigue: number        // 0–100
  salary: number
  mood: number           // 0–100
  currentTask: StaffTask | null
  position: { x: number; y: number } // on floor canvas
}

export type StaffTask =
  | { type: 'make_order'; orderId: string }
  | { type: 'serve_customer'; customerId: string; orderId: string }
  | { type: 'clean_table'; tableId: string }
  | { type: 'restock'; ingredientId: string }
  | { type: 'idle' }

export type CustomerType = 'student' | 'office_worker' | 'tourist' | 'regular'

export interface Customer {
  id: string
  type: CustomerType
  name: string
  patience: number       // 0–100, giảm khi chờ. Nếu = 0: bỏ đi, review tệ
  satisfaction: number   // 0–100
  tableId: string | null
  orderId: string | null
  state: CustomerState
  arrivalTime: number    // in-game ms
  budgetMultiplier: number // 0.5–2.0 tuỳ type
}

export type CustomerState =
  | 'entering'
  | 'waiting_for_seat'
  | 'seated'
  | 'ordering'
  | 'waiting_for_order'
  | 'eating'
  | 'paying'
  | 'leaving'
  | 'left_unhappy'

export interface MenuItem {
  id: string
  name: string
  category: 'coffee' | 'tea' | 'food' | 'dessert'
  price: number
  baseCost: number
  prepTimeSeconds: number
  isAvailable: boolean
  unlocked: boolean
  ingredients: { ingredientId: string; amount: number }[]
  popularityScore: number // 0–100, tăng khi nhiều người đặt
}

export interface Order {
  id: string
  customerId: string
  tableId: string
  items: { menuItemId: string; quantity: number }[]
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  createdAt: number      // in-game ms
  totalPrice: number
  assignedStaffId: string | null
}

export interface Table {
  id: string
  seats: number
  position: { x: number; y: number }
  state: 'empty' | 'occupied' | 'dirty' | 'reserved'
  occupiedBy: string[]   // customer IDs
}
```

---

## 12. Game Config Constants — `packages/shared/src/constants/gameConfig.ts`

```typescript
export const GAME_CONFIG = {
  // Time
  REAL_MS_PER_INGAME_MINUTE: 1000,     // 1 real giây = 1 game phút ở speed x1
  OPENING_HOUR: 7,
  CLOSING_HOUR: 22,
  MAX_OFFLINE_MINUTES: 480,            // 8 tiếng game tối đa khi offline

  // Economy
  STARTING_CASH: 5_000_000,           // VND
  DAILY_RENT_BASE: 500_000,
  INGREDIENT_RESTOCK_COST_MULTIPLIER: 1.2,

  // Staff
  FATIGUE_PER_30_MIN: 1,
  FATIGUE_SLOW_THRESHOLD: 80,
  FATIGUE_REFUSE_THRESHOLD: 95,
  STAFF_SPEED_MULTIPLIER: {            // level bonus
    1: 1.0, 2: 1.05, 3: 1.1, 4: 1.15, 5: 1.2,
    6: 1.3, 7: 1.4, 8: 1.5, 9: 1.65, 10: 1.8,
  },

  // Customer
  PATIENCE_DRAIN_PER_MINUTE: 5,       // bình thường
  PATIENCE_DRAIN_WHEN_WAITING_ORDER: 8,
  MIN_SATISFACTION_FOR_GOOD_REVIEW: 60,

  // Reputation
  REPUTATION_DECAY_PER_DAY: 0.5,      // giảm nhẹ mỗi ngày nếu không có review
  REPUTATION_GAIN_PER_5STAR: 2,
  REPUTATION_LOSS_PER_1STAR: 3,

  // Autosave
  AUTOSAVE_INTERVAL_MS: 30_000,        // 30 giây
  CLOUD_SYNC_INTERVAL_MS: 300_000,     // 5 phút
}
```

---

## 13. Sequence Diagram: Save & Sync

```
Client                  IndexedDB (Dexie)        Cloudflare Worker (D1)
  |                           |                           |
  |── game tick ──────────────>|                           |
  |   (mỗi 30s)               |                           |
  |── serialize state ────────>|                           |
  |<── saved (local) ─────────|                           |
  |                           |                           |
  |   (mỗi 5 phút / on focus) |                           |
  |── check cloudSynced=false ─>|                          |
  |<── list of dirty saves ───|                           |
  |── PUT /save/:id ──────────────────────────────────────>|
  |                           |                     validate token
  |                           |                     compare timestamps
  |<── 200 OK ────────────────────────────────────────────|
  |── mark cloudSynced=true ──>|                           |
  |                           |                           |
  |   (khi load game)         |                           |
  |── load from IndexedDB ────>|                           |
  |<── instant load ──────────|                           |
  |── background: GET /save ─────────────────────────────>|
  |<── server saves list ─────────────────────────────────|
  |   compare timestamps      |                           |
  |── (nếu server newer)      |                           |
  |   show "Tìm thấy save mới hơn" dialog                 |
```

---

## 14. Yêu cầu triển khai ban đầu (Phase 1 MVP)

Implement theo thứ tự sau:

### Bước 1: Project setup
- [ ] Khởi tạo pnpm monorepo với `pnpm-workspace.yaml`
- [ ] Setup `packages/shared` với các types và constants
- [ ] Setup `apps/web` với Vite + React + TypeScript + Tailwind
- [ ] Setup `apps/worker` với Wrangler + Hono

### Bước 2: Database
- [ ] Implement `CafeTycoonDB` với Dexie.js (Section 4.1)
- [ ] Implement D1 schema SQL (Section 4.2)
- [ ] Implement `saveManager.ts` với autosave + export/import

### Bước 3: Game Engine
- [ ] Implement `GameLoop.ts` với requestAnimationFrame
- [ ] Implement `TimeManager.ts`
- [ ] Implement `CustomerAI.ts` (spawn + state machine)
- [ ] Implement `StaffAI.ts` (task assignment, basic pathfinding)
- [ ] Implement `FinanceSystem.ts`

### Bước 4: Zustand Store
- [ ] Implement `useGameStore.ts` với tất cả actions (Section 5)
- [ ] Implement `useUIStore.ts`
- [ ] Connect store với game engine

### Bước 5: UI cơ bản
- [ ] `TopBar.tsx` — hiển thị cash, ngày, giờ, reputation
- [ ] `MenuPanel.tsx` — CRUD menu items
- [ ] `StaffPanel.tsx` — hire/fire, xem stats
- [ ] `FinancePanel.tsx` — chart doanh thu 7 ngày

### Bước 6: Cloudflare Worker
- [ ] Auth routes (register, login, me)
- [ ] Save routes (CRUD với conflict detection)
- [ ] JWT middleware + KV rate limiting
- [ ] Deploy với `wrangler deploy`

### Bước 7: PWA
- [ ] Cấu hình `vite-plugin-pwa` (Section 7)
- [ ] Tạo icons (192x192, 512x512, maskable)
- [ ] Test install prompt trên Chrome mobile

---

## 15. Lưu ý quan trọng

1. **Không dùng `localStorage`** — dùng IndexedDB (Dexie) cho tất cả persistence
2. **Game state trong Zustand chỉ là runtime** — source of truth là IndexedDB
3. **Tất cả số tiền** dùng đơn vị VND (integer, không có decimal)
4. **In-game time** tính bằng milliseconds từ đầu ngày, không phải Date object
5. **Cloudflare Worker** phải handle CORS cho domain frontend
6. **Save data** gửi lên cloud là JSON string, tối đa 5MB per save slot
7. **D1 queries** phải dùng prepared statements, không string concatenation
8. **JWT secret** phải set qua `wrangler secret put JWT_SECRET`, không hardcode trong `wrangler.toml`
9. **Rate limiting** dùng Cloudflare KV với TTL, không dùng D1 (quá chậm cho mỗi request)
10. **PixiJS** chỉ dùng cho floor canvas, tất cả UI/menu/panel dùng React DOM

---

*Spec version 1.0 — Café Tycoon PWA*
