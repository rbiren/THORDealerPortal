# THORDealerPortal - Comprehensive Development Task Backlog

This document contains the complete task breakdown for building THORDealerPortal using Ralph Wiggum autonomous development loops.

---

## Priority & Status Legends

### Priority
- 🔴 **P0 - Critical** - Blocking, must complete immediately
- 🟠 **P1 - High** - Required for current phase
- 🟡 **P2 - Medium** - Important, schedule soon
- 🟢 **P3 - Low** - Nice to have, backlog

### Status
- ⏳ **Queued** - Ready to start
- 🔄 **In Progress** - Currently running
- ✅ **Complete** - Finished and verified
- ⏸️ **Blocked** - Waiting on dependency
- ❌ **Cancelled** - No longer needed

---

## Phase 0: Foundation

**Timeline**: Weeks 1-2
**Goal**: Project infrastructure and base setup

### 0.1 Repository & Tooling Setup

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 0.1.1 | 🔴 | ✅ | Initialize Next.js 14+ with TypeScript | Manual | *Completed 2026-01-01* |
| 0.1.2 | 🔴 | ✅ | Configure ESLint + Prettier | Manual | *Completed 2026-01-01 (ESLint done, Prettier pending)* |
| 0.1.3 | 🔴 | ✅ | Setup Tailwind CSS + shadcn/ui | Manual | *Completed 2026-01-01 (Tailwind done, shadcn pending)* |
| 0.1.4 | 🟠 | ✅ | Configure path aliases | Manual | *Completed 2026-01-01* |
| 0.1.5 | 🟠 | ✅ | Add .gitignore and .env.example | Manual | *Completed 2026-01-01* |

### 0.2 Testing Infrastructure

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 0.2.1 | 🔴 | ✅ | Setup Jest + React Testing Library | Manual | *Completed 2026-01-01 (14 tests passing)* |
| 0.2.2 | 🟠 | ⏳ | Setup Playwright for E2E | 10 | `/ralph-loop "Install and configure Playwright with Next.js. Create example E2E test for home page. Add test scripts to package.json" --max-iterations 10` |
| 0.2.3 | 🟡 | ✅ | Configure test coverage | Manual | *Completed 2026-01-01 (70% threshold)* |

### 0.3 Database Setup

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 0.3.1 | 🔴 | ✅ | Install and configure Prisma | Manual | *Completed 2026-01-01 (SQLite for local dev)* |
| 0.3.2 | 🔴 | ✅ | Create complete database schema | Manual | *Completed 2026-01-01 (14 models)* |
| 0.3.3 | 🟠 | ❌ | Setup Docker Compose for local dev | - | *Cancelled - using SQLite instead* |
| 0.3.4 | 🟠 | ✅ | Create seed data script | Manual | *Completed 2026-01-01* |

### 0.4 CI/CD Pipeline

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 0.4.1 | 🟠 | ⏳ | Setup GitHub Actions CI | 12 | `/ralph-loop "Create GitHub Actions workflow for: lint, type-check, unit tests, build. Run on PR and push to main. Cache dependencies" --max-iterations 12` |
| 0.4.2 | 🟡 | ⏳ | Add E2E tests to CI | 10 | `/ralph-loop "Add Playwright E2E tests to GitHub Actions. Use containerized PostgreSQL for tests. Upload test artifacts on failure" --max-iterations 10` |
| 0.4.3 | 🟢 | ⏳ | Setup preview deployments | 15 | `/ralph-loop "Configure Vercel preview deployments for PRs. Add deployment status checks to GitHub. Configure environment variables" --max-iterations 15` |

---

## Phase 1: Authentication & Core

**Timeline**: Weeks 3-5
**Goal**: Secure foundation with basic dealer management

### 1.1 Authentication System

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.1.1 | 🔴 | ✅ | Implement NextAuth.js setup | Manual | *Completed 2026-01-01 (38 tests passing)* |
| 1.1.2 | 🔴 | ✅ | Create login page and flow | Manual | *Completed 2026-01-01 (48 tests passing)* |
| 1.1.3 | 🔴 | ✅ | Implement password reset flow | Manual | *Completed 2026-01-01 (57 tests passing)* |
| 1.1.4 | 🟠 | ⏳ | Add session management | 12 | `/ralph-loop "Implement session listing and management. Allow users to view active sessions and revoke them. Track IP and user agent" --max-iterations 12` |
| 1.1.5 | 🟠 | ⏳ | Implement MFA (TOTP) | 20 | `/ralph-loop "Add optional TOTP-based MFA. Create setup flow with QR code, verification, and backup codes. Integrate with login flow" --max-iterations 20` |
| 1.1.6 | 🟡 | ⏳ | Add account lockout | 10 | `/ralph-loop "Implement progressive account lockout after failed login attempts. Add unlock mechanism and admin override capability" --max-iterations 10` |

### 1.2 Authorization & RBAC

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.2.1 | 🔴 | ✅ | Create role-based permission system | Manual | *Completed with 1.1.1 (roles.ts)* |
| 1.2.2 | 🔴 | ✅ | Add route protection middleware | Manual | *Completed with 1.1.1 (middleware.ts)* |
| 1.2.3 | 🟠 | ✅ | Implement permission guards | Manual | *Completed 2026-01-01 (hooks + components)* |

### 1.3 User Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.3.1 | 🔴 | ✅ | Create user profile page | Manual | *Completed 2026-01-01 (68 tests passing)* |
| 1.3.2 | 🟠 | ✅ | Implement password change | Manual | *Completed 2026-01-01 (79 tests passing)* |
| 1.3.3 | 🟠 | ✅ | Build user list (admin) | Manual | *Completed 2026-01-01 (112 tests passing)* |
| 1.3.4 | 🟠 | ✅ | Implement user CRUD (admin) | Manual | *Completed 2026-01-01 (121 tests passing)* |

### 1.4 Dealer Management Core

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.4.1 | 🔴 | ✅ | Create dealer list view | Manual | *Completed 2026-01-01 (152 tests passing)* |
| 1.4.2 | 🔴 | ✅ | Implement dealer CRUD | Manual | *Completed 2026-01-01 (163 tests passing)* |
| 1.4.3 | 🟠 | ✅ | Build dealer detail page | Manual | *Completed 2026-01-01 (173 tests passing)* |
| 1.4.4 | 🟠 | ✅ | Implement dealer onboarding | Manual | *Completed 2026-01-01 (204 tests passing)* |
| 1.4.5 | 🟡 | ⏳ | Add dealer hierarchy | 12 | `/ralph-loop "Implement parent/child dealer relationships. Create hierarchy visualization. Handle permissions inheritance" --max-iterations 12` |

### 1.5 Audit Logging

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.5.1 | 🟠 | ⏳ | Implement audit log service | 12 | `/ralph-loop "Create audit logging service that tracks: user actions, entity changes, before/after values. Store in database with proper indexing" --max-iterations 12` |
| 1.5.2 | 🟠 | ⏳ | Build audit log viewer | 12 | `/ralph-loop "Create admin audit log viewer with: filtering by user/action/entity, date range, search. Paginated results with detail expansion" --max-iterations 12` |

---

## Phase 2: Inventory & Products

**Timeline**: Weeks 6-8
**Goal**: Product catalog and inventory visibility

### 2.1 Product Catalog

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.1.1 | 🔴 | ⏳ | Create product list view | 15 | `/ralph-loop "Build product catalog page with grid/list toggle. Show product cards with image, name, SKU, price, stock status. Add pagination" --max-iterations 15` |
| 2.1.2 | 🔴 | ⏳ | Implement product search | 15 | `/ralph-loop "Add product search with PostgreSQL full-text search. Include autocomplete, search history, and relevance sorting. Debounce input" --max-iterations 15 --completion-promise "SEARCH WORKING"` |
| 2.1.3 | 🔴 | ⏳ | Build product filters | 12 | `/ralph-loop "Create product filtering: categories, price range, availability, attributes. Implement filter chips, clear all. URL parameter sync" --max-iterations 12` |
| 2.1.4 | 🟠 | ⏳ | Create product detail page | 18 | `/ralph-loop "Build product detail page with: image gallery, specifications, inventory by location, related products. Add to cart functionality" --max-iterations 18` |
| 2.1.5 | 🟠 | ⏳ | Implement category navigation | 12 | `/ralph-loop "Create category sidebar with hierarchical navigation. Show product counts. Support expand/collapse. Highlight active category" --max-iterations 12` |

### 2.2 Product Management (Admin)

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.2.1 | 🟠 | ⏳ | Build product CRUD | 20 | `/ralph-loop "Create product management forms: basic info, pricing, categories, specifications. Add image upload with drag-drop. Preview before save" --max-iterations 20` |
| 2.2.2 | 🟠 | ⏳ | Implement category management | 12 | `/ralph-loop "Build category CRUD with drag-drop reordering. Support nested categories up to 3 levels. Add icon/image upload" --max-iterations 12` |
| 2.2.3 | 🟡 | ⏳ | Add bulk product import | 15 | `/ralph-loop "Create CSV/Excel product import: template download, file upload, validation preview, import with error handling. Show progress" --max-iterations 15` |

### 2.3 Inventory Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.3.1 | 🔴 | ⏳ | Create inventory dashboard | 15 | `/ralph-loop "Build inventory dashboard with: total stock, low stock alerts, inventory value. Add location breakdown and quick filters" --max-iterations 15` |
| 2.3.2 | 🟠 | ⏳ | Implement inventory list | 12 | `/ralph-loop "Create inventory list view: product, location, quantity, reserved, available. Add sorting, filtering, export functionality" --max-iterations 12` |
| 2.3.3 | 🟠 | ⏳ | Build location management | 10 | `/ralph-loop "Create inventory location CRUD. Support warehouse, store types. Add address and contact information" --max-iterations 10` |
| 2.3.4 | 🟠 | ⏳ | Add inventory adjustments | 12 | `/ralph-loop "Implement inventory adjustment feature: add/remove stock with reason codes. Create adjustment history log with audit trail" --max-iterations 12` |
| 2.3.5 | 🟡 | ⏳ | Create low stock alerts | 10 | `/ralph-loop "Implement configurable low stock thresholds. Create alert system that notifies via in-app and email. Add alert acknowledgment" --max-iterations 10` |

### 2.4 Inventory Sync Service

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.4.1 | 🟠 | ⏳ | Design sync architecture | 15 | `/ralph-loop "Create inventory sync service architecture: queue-based processing, delta updates, conflict resolution. Add retry logic and dead letter queue" --max-iterations 15` |
| 2.4.2 | 🟡 | ⏳ | Implement sync job runner | 15 | `/ralph-loop "Build BullMQ job runner for inventory sync. Process updates in batches. Handle failures gracefully. Add monitoring" --max-iterations 15` |
| 2.4.3 | 🟡 | ⏳ | Create sync admin UI | 10 | `/ralph-loop "Build admin UI for sync management: status, last run, manual trigger, error logs. Show sync history and statistics" --max-iterations 10` |

---

## Phase 3: Order Management

**Timeline**: Weeks 9-12
**Goal**: Complete order processing workflow

### 3.1 Shopping Cart

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.1.1 | 🔴 | ⏳ | Implement cart state management | 12 | `/ralph-loop "Create cart state with Zustand: add/remove items, update quantities, persist to localStorage. Sync with server for logged-in users" --max-iterations 12` |
| 3.1.2 | 🔴 | ⏳ | Build cart UI components | 15 | `/ralph-loop "Create cart components: cart icon with count, cart drawer/sidebar, cart page. Show items, quantities, subtotal. Add quantity controls" --max-iterations 15 --completion-promise "CART COMPLETE"` |
| 3.1.3 | 🟠 | ⏳ | Add cart validation | 10 | `/ralph-loop "Implement cart validation: check inventory availability, price changes, product status. Show warnings for issues. Block checkout if invalid" --max-iterations 10` |
| 3.1.4 | 🟡 | ⏳ | Create saved carts feature | 12 | `/ralph-loop "Add ability to save and name carts. List saved carts with restore functionality. Share cart links between dealer users" --max-iterations 12` |

### 3.2 Checkout Flow

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.2.1 | 🔴 | ⏳ | Build checkout page | 20 | `/ralph-loop "Create multi-step checkout: 1) Review cart 2) Shipping address 3) Payment selection 4) Review & confirm. Add progress indicator, validation" --max-iterations 20` |
| 3.2.2 | 🔴 | ⏳ | Implement address selection | 12 | `/ralph-loop "Build shipping address step: select from saved addresses, add new address. Validate addresses. Set default address" --max-iterations 12` |
| 3.2.3 | 🟠 | ⏳ | Create order summary component | 10 | `/ralph-loop "Build order summary component showing: items, quantities, subtotal, tax calculation, shipping, total. Update in real-time" --max-iterations 10` |
| 3.2.4 | 🟠 | ⏳ | Add checkout validation | 12 | `/ralph-loop "Implement final checkout validation: inventory locks, payment authorization. Handle race conditions. Show clear error messages" --max-iterations 12` |

### 3.3 Order Processing

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.3.1 | 🔴 | ⏳ | Create order service | 18 | `/ralph-loop "Build order service: create order from cart, reserve inventory, calculate totals, send confirmation. Handle transaction rollback on failure" --max-iterations 18 --completion-promise "ORDER SERVICE COMPLETE"` |
| 3.3.2 | 🔴 | ⏳ | Implement order confirmation | 12 | `/ralph-loop "Create order confirmation page: order number, summary, expected delivery. Send confirmation email. Clear cart on success" --max-iterations 12` |
| 3.3.3 | 🟠 | ⏳ | Build order status updates | 15 | `/ralph-loop "Implement order status workflow: submitted → confirmed → processing → shipped → delivered. Add status change notifications" --max-iterations 15` |
| 3.3.4 | 🟠 | ⏳ | Create order cancellation | 10 | `/ralph-loop "Add order cancellation: validate cancellable status, release inventory, update order status. Handle partial cancellations" --max-iterations 10` |

### 3.4 Order History & Tracking

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.4.1 | 🔴 | ⏳ | Build order list page | 15 | `/ralph-loop "Create order history page: sortable table with order number, date, status, total. Add filters by status, date range. Pagination" --max-iterations 15` |
| 3.4.2 | 🔴 | ⏳ | Create order detail page | 18 | `/ralph-loop "Build order detail page: order info, items, status timeline, shipping info, documents. Add reorder and invoice download actions" --max-iterations 18` |
| 3.4.3 | 🟠 | ⏳ | Implement order search | 10 | `/ralph-loop "Add order search by: order number, PO number, product. Include autocomplete and recent searches. Show quick results" --max-iterations 10` |
| 3.4.4 | 🟡 | ⏳ | Add shipping tracking | 12 | `/ralph-loop "Integrate shipping carrier tracking: fetch tracking info, display delivery status, estimated delivery. Support multiple carriers" --max-iterations 12` |

### 3.5 Invoice Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.5.1 | 🟠 | ⏳ | Create invoice generation | 15 | `/ralph-loop "Build PDF invoice generator: order details, line items, totals, payment terms. Use professional template. Store generated PDFs" --max-iterations 15` |
| 3.5.2 | 🟠 | ⏳ | Build invoice list | 10 | `/ralph-loop "Create invoice list view: invoice number, order, date, amount, status. Add filters and download functionality" --max-iterations 10` |
| 3.5.3 | 🟡 | ⏳ | Add invoice email delivery | 8 | `/ralph-loop "Implement automatic invoice email on order confirmation. Add manual resend option. Track delivery status" --max-iterations 8` |

### 3.6 Admin Order Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.6.1 | 🟠 | ⏳ | Build admin order list | 15 | `/ralph-loop "Create admin order management: all orders across dealers, advanced filters, bulk status updates. Export functionality" --max-iterations 15` |
| 3.6.2 | 🟠 | ⏳ | Add order editing | 12 | `/ralph-loop "Implement admin order editing: modify quantities, add/remove items, adjust pricing. Add audit trail for changes" --max-iterations 12` |
| 3.6.3 | 🟡 | ⏳ | Create order notes | 8 | `/ralph-loop "Add internal order notes feature: admin can add notes, visibility controls. Show in timeline. Notify relevant users" --max-iterations 8` |

---

## Phase 4: Reporting & Analytics

**Timeline**: Weeks 13-15
**Goal**: Data insights for dealers and admins

### 4.1 Dealer Dashboard

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.1.1 | 🔴 | ⏳ | Create dealer dashboard layout | 15 | `/ralph-loop "Build dealer dashboard with card-based layout: quick stats, recent orders, inventory alerts, notifications. Responsive grid" --max-iterations 15` |
| 4.1.2 | 🔴 | ⏳ | Add sales metrics cards | 12 | `/ralph-loop "Create sales metric cards: MTD sales, YTD sales, vs previous period, order count. Add trend indicators and sparkline charts" --max-iterations 12 --completion-promise "DASHBOARD METRICS COMPLETE"` |
| 4.1.3 | 🟠 | ⏳ | Build recent activity feed | 10 | `/ralph-loop "Create activity feed component: recent orders, status changes, document uploads. Infinite scroll, filter by type" --max-iterations 10` |
| 4.1.4 | 🟠 | ⏳ | Add quick actions panel | 8 | `/ralph-loop "Create quick actions: new order, browse products, view reports, manage users. Customizable shortcuts for dealers" --max-iterations 8` |

### 4.2 Sales Reports

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.2.1 | 🔴 | ⏳ | Create sales summary report | 18 | `/ralph-loop "Build sales summary report: date range selector, total sales, order count, average order value. Bar/line charts for trends" --max-iterations 18` |
| 4.2.2 | 🟠 | ⏳ | Add product sales breakdown | 12 | `/ralph-loop "Create product sales report: top sellers, category breakdown, product performance table. Add drill-down capability" --max-iterations 12` |
| 4.2.3 | 🟠 | ⏳ | Build comparison reports | 12 | `/ralph-loop "Create period comparison: YoY, MoM, custom ranges. Show growth percentages, variance highlighting" --max-iterations 12` |
| 4.2.4 | 🟡 | ⏳ | Add sales forecasting | 15 | `/ralph-loop "Implement basic sales forecasting: trend analysis, seasonal patterns, projected values. Show confidence intervals" --max-iterations 15` |

### 4.3 Inventory Reports

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.3.1 | 🟠 | ⏳ | Create inventory value report | 12 | `/ralph-loop "Build inventory value report: total value by location, category. Cost vs retail value. Historical value chart" --max-iterations 12` |
| 4.3.2 | 🟠 | ⏳ | Add inventory turnover report | 12 | `/ralph-loop "Create turnover report: products by turnover rate, slow movers, fast movers. Days of supply calculation" --max-iterations 12` |
| 4.3.3 | 🟡 | ⏳ | Build inventory aging report | 10 | `/ralph-loop "Create aging report: products by age bucket (30/60/90/120+ days). Identify obsolete inventory risk" --max-iterations 10` |

### 4.4 Admin Analytics

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.4.1 | 🟠 | ⏳ | Create admin analytics dashboard | 18 | `/ralph-loop "Build admin analytics: network-wide sales, dealer performance, inventory health. Executive summary with key KPIs" --max-iterations 18` |
| 4.4.2 | 🟠 | ⏳ | Add dealer comparison | 12 | `/ralph-loop "Create dealer comparison report: rank dealers by sales, growth, order frequency. Tier distribution analysis" --max-iterations 12` |
| 4.4.3 | 🟡 | ⏳ | Build system usage analytics | 10 | `/ralph-loop "Create usage analytics: active users, feature usage, session metrics. Identify adoption patterns" --max-iterations 10` |

### 4.5 Export & Scheduling

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.5.1 | 🟠 | ⏳ | Implement report export | 12 | `/ralph-loop "Add report export: PDF with charts, Excel with raw data, CSV. Background generation for large reports" --max-iterations 12` |
| 4.5.2 | 🟡 | ⏳ | Create scheduled reports | 15 | `/ralph-loop "Build report scheduling: frequency (daily/weekly/monthly), recipients, format. Email delivery with attachments" --max-iterations 15` |
| 4.5.3 | 🟡 | ⏳ | Add custom report builder | 20 | `/ralph-loop "Create drag-drop report builder: select metrics, dimensions, filters, visualizations. Save custom reports" --max-iterations 20` |

---

## Phase 5: Documents & Notifications

**Timeline**: Weeks 16-18
**Goal**: Document management and communication

### 5.1 Document Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.1.1 | 🔴 | ⏳ | Build document library | 15 | `/ralph-loop "Create document library: folder structure, grid/list view, thumbnail previews. Categories, tags, search. Responsive design" --max-iterations 15` |
| 5.1.2 | 🔴 | ⏳ | Implement file upload | 15 | `/ralph-loop "Create file upload: drag-drop, progress indicator, type validation. S3 presigned URLs for direct upload. Virus scanning integration point" --max-iterations 15 --completion-promise "UPLOAD WORKING"` |
| 5.1.3 | 🟠 | ⏳ | Add document preview | 12 | `/ralph-loop "Implement document preview: PDF viewer, image lightbox, Office document preview. In-modal viewing without download" --max-iterations 12` |
| 5.1.4 | 🟠 | ⏳ | Create version control | 12 | `/ralph-loop "Add document versioning: upload new version, version history, restore previous. Track changes and uploaders" --max-iterations 12` |
| 5.1.5 | 🟡 | ⏳ | Implement access control | 10 | `/ralph-loop "Create document permissions: public, dealer-specific, role-based. Admin override capability. Audit access logs" --max-iterations 10` |
| 5.1.6 | 🟡 | ⏳ | Add expiration tracking | 8 | `/ralph-loop "Implement document expiration: set expiry dates, renewal reminders, expired document handling. Dashboard widget" --max-iterations 8` |

### 5.2 Notification System

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.2.1 | 🔴 | ⏳ | Create notification service | 15 | `/ralph-loop "Build notification service: create, send, mark read. Support multiple channels. Queue-based delivery. Template system" --max-iterations 15` |
| 5.2.2 | 🔴 | ⏳ | Build in-app notifications | 12 | `/ralph-loop "Create notification UI: bell icon with count, dropdown with list, notification center page. Mark read, clear all" --max-iterations 12` |
| 5.2.3 | 🟠 | ⏳ | Implement email notifications | 12 | `/ralph-loop "Setup transactional email: templates for order updates, alerts, system messages. Resend/SendGrid integration. Unsubscribe links" --max-iterations 12` |
| 5.2.4 | 🟠 | ⏳ | Add notification preferences | 10 | `/ralph-loop "Create preference UI: toggle by notification type, channel selection (in-app, email, SMS). Per-user configuration" --max-iterations 10` |
| 5.2.5 | 🟡 | ⏳ | Create system announcements | 10 | `/ralph-loop "Build announcement system: admin creates banners/modals, target audience selection, scheduling, dismissal tracking" --max-iterations 10` |

### 5.3 Real-time Updates

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.3.1 | 🟡 | ⏳ | Setup WebSocket infrastructure | 15 | `/ralph-loop "Implement Socket.io: connection management, authentication, room-based subscriptions. Redis adapter for scaling" --max-iterations 15` |
| 5.3.2 | 🟡 | ⏳ | Add real-time notifications | 10 | `/ralph-loop "Connect notifications to WebSocket: push new notifications instantly, update counts. Fallback to polling" --max-iterations 10` |
| 5.3.3 | 🟢 | ⏳ | Implement live order updates | 10 | `/ralph-loop "Add real-time order status: push updates to dealer when order status changes. Show toast notifications" --max-iterations 10` |

---

## Phase 6: Integrations & Polish

**Timeline**: Weeks 19-22
**Goal**: External integrations and refinement

### 6.1 External Integrations

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 6.1.1 | 🟠 | ⏳ | Design integration framework | 15 | `/ralph-loop "Create integration framework: webhook handling, API client base, retry logic, error handling, logging. Config-driven" --max-iterations 15` |
| 6.1.2 | 🟠 | ⏳ | Implement ERP integration stub | 15 | `/ralph-loop "Create ERP integration interface: order sync, inventory sync, dealer sync. Mock implementation for testing. Queue-based" --max-iterations 15` |
| 6.1.3 | 🟡 | ⏳ | Add payment gateway | 18 | `/ralph-loop "Integrate payment gateway (Stripe): payment intents, webhook handling, refunds. PCI-compliant token handling" --max-iterations 18` |
| 6.1.4 | 🟡 | ⏳ | Setup email service | 10 | `/ralph-loop "Configure transactional email service (Resend): API integration, template management, delivery tracking. Bounce handling" --max-iterations 10` |

### 6.2 Performance Optimization

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 6.2.1 | 🟠 | ⏳ | Implement caching layer | 15 | `/ralph-loop "Add Redis caching: API response caching, session caching, rate limiting. Cache invalidation strategies. Cache warming" --max-iterations 15` |
| 6.2.2 | 🟠 | ⏳ | Optimize database queries | 15 | `/ralph-loop "Analyze and optimize slow queries: add indexes, optimize N+1 queries, implement query result caching. Add query monitoring" --max-iterations 15 --completion-promise "QUERIES OPTIMIZED"` |
| 6.2.3 | 🟡 | ⏳ | Add lazy loading | 10 | `/ralph-loop "Implement code splitting: route-based splitting, lazy components, dynamic imports. Reduce initial bundle size" --max-iterations 10` |
| 6.2.4 | 🟡 | ⏳ | Optimize images | 8 | `/ralph-loop "Setup image optimization: next/image, responsive images, WebP conversion, lazy loading, CDN delivery" --max-iterations 8` |

### 6.3 Accessibility & UX

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 6.3.1 | 🟠 | ⏳ | Accessibility audit & fixes | 20 | `/ralph-loop "Run accessibility audit: fix WCAG 2.1 AA violations, add ARIA labels, keyboard navigation, screen reader support. Test with axe" --max-iterations 20` |
| 6.3.2 | 🟡 | ⏳ | Add loading states | 12 | `/ralph-loop "Implement consistent loading states: skeleton screens, spinners, progress indicators. Suspense boundaries" --max-iterations 12` |
| 6.3.3 | 🟡 | ⏳ | Improve error handling | 12 | `/ralph-loop "Create error handling: error boundaries, user-friendly messages, recovery options. Sentry integration for tracking" --max-iterations 12` |
| 6.3.4 | 🟢 | ⏳ | Add dark mode | 15 | `/ralph-loop "Implement dark mode: theme toggle, system preference detection, persistent preference. Update all components" --max-iterations 15` |

### 6.4 Security Hardening

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 6.4.1 | 🔴 | ⏳ | Security audit | 20 | `/ralph-loop "Conduct security audit: review auth flows, check for OWASP top 10, validate input sanitization, check dependencies. Fix findings" --max-iterations 20 --completion-promise "SECURITY AUDIT COMPLETE"` |
| 6.4.2 | 🟠 | ⏳ | Add rate limiting | 10 | `/ralph-loop "Implement rate limiting: per-IP, per-user limits. Configurable by endpoint. Redis-based with sliding window" --max-iterations 10` |
| 6.4.3 | 🟠 | ⏳ | Setup CSP headers | 8 | `/ralph-loop "Configure Content Security Policy: strict CSP rules, nonce-based script loading, report violations" --max-iterations 8` |
| 6.4.4 | 🟡 | ⏳ | Add security headers | 5 | `/ralph-loop "Configure security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy" --max-iterations 5` |

---

## Phase 7: Launch Preparation

**Timeline**: Weeks 23-24
**Goal**: Production readiness

### 7.1 Infrastructure Setup

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 7.1.1 | 🔴 | ⏳ | Production infrastructure | 20 | `/ralph-loop "Create Terraform/CDK for AWS infrastructure: VPC, ECS, RDS, ElastiCache, S3, CloudFront, ALB. Multi-AZ deployment" --max-iterations 20` |
| 7.1.2 | 🔴 | ⏳ | Setup monitoring | 15 | `/ralph-loop "Configure monitoring: CloudWatch metrics, custom dashboards, alerting rules. Application metrics, error tracking" --max-iterations 15` |
| 7.1.3 | 🟠 | ⏳ | Configure logging | 10 | `/ralph-loop "Setup centralized logging: structured logs, log aggregation, search capability. Log retention policies" --max-iterations 10` |
| 7.1.4 | 🟠 | ⏳ | Implement backup strategy | 10 | `/ralph-loop "Configure automated backups: database snapshots, S3 replication, recovery procedures. Test restore process" --max-iterations 10` |

### 7.2 Testing & Validation

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 7.2.1 | 🔴 | ⏳ | Load testing | 15 | `/ralph-loop "Create k6 load tests: simulate 100+ concurrent users, test critical paths. Identify bottlenecks, document results" --max-iterations 15 --completion-promise "LOAD TESTS PASS"` |
| 7.2.2 | 🔴 | ⏳ | End-to-end test suite | 20 | `/ralph-loop "Create comprehensive E2E tests: all critical user flows, edge cases, error scenarios. Playwright test suite" --max-iterations 20` |
| 7.2.3 | 🟠 | ⏳ | Performance benchmarks | 10 | `/ralph-loop "Establish performance benchmarks: page load times, API response times, Core Web Vitals. Set monitoring thresholds" --max-iterations 10` |

### 7.3 Documentation

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 7.3.1 | 🟠 | ⏳ | API documentation | 15 | `/ralph-loop "Generate API documentation: OpenAPI spec, request/response examples, authentication guide. Swagger UI" --max-iterations 15` |
| 7.3.2 | 🟠 | ⏳ | User documentation | 15 | `/ralph-loop "Create user guides: dealer quick start, admin manual, feature documentation. Screenshots and videos" --max-iterations 15` |
| 7.3.3 | 🟠 | ⏳ | Operations runbook | 12 | `/ralph-loop "Write operations runbook: deployment procedures, incident response, troubleshooting guides, contact escalation" --max-iterations 12` |

---

## Completed Tasks

| ID | Task | Iterations Used | Date | Notes |
|----|------|-----------------|------|-------|
| DOC-001 | Initial documentation setup | Manual | 2026-01-01 | CLAUDE.md, Ralph Wiggum guide |
| DOC-002 | Project plan and task backlog | Manual | 2026-01-01 | PROJECT_PLAN.md, 117 tasks |
| DOC-003 | Documentation consolidation | Manual | 2026-01-01 | Added doc governance rules |
| 0.1.1 | Next.js 14 + TypeScript setup | Manual | 2026-01-01 | App router, src/ structure |
| 0.1.2 | ESLint configuration | Manual | 2026-01-01 | Prettier pending |
| 0.1.3 | Tailwind CSS setup | Manual | 2026-01-01 | shadcn/ui pending |
| 0.1.4 | Path aliases (@/*) | Manual | 2026-01-01 | tsconfig.json |
| 0.1.5 | .gitignore + .env.example | Manual | 2026-01-01 | Comprehensive ignores |
| 0.2.1 | Jest + Testing Library | Manual | 2026-01-01 | 14 tests passing |
| 0.2.3 | Test coverage config | Manual | 2026-01-01 | 70% threshold |
| 0.3.1 | Prisma + SQLite | Manual | 2026-01-01 | Zero-config local dev |
| 0.3.2 | Database schema (14 models) | Manual | 2026-01-01 | Full schema from plan |
| 0.3.4 | Seed data script | Manual | 2026-01-01 | 4 dealers, 5 products |
| 1.1.1 | NextAuth.js setup | Manual | 2026-01-01 | Credentials, JWT, bcrypt, RBAC utils |
| 1.1.2 | Login page and flow | Manual | 2026-01-01 | Login form, validation, server action, dashboard |
| 1.1.3 | Password reset flow | Manual | 2026-01-01 | Token service, email service, forgot/reset pages |
| 1.2.1 | Role-based permission system | Manual | 2026-01-01 | Completed with 1.1.1 |
| 1.2.2 | Route protection middleware | Manual | 2026-01-01 | Completed with 1.1.1 |
| 1.2.3 | Permission guards | Manual | 2026-01-01 | hooks + components |
| 1.3.1 | User profile page | Manual | 2026-01-01 | 68 tests passing |
| 1.3.2 | Password change | Manual | 2026-01-01 | 79 tests passing |
| 1.3.3 | User list (admin) | Manual | 2026-01-01 | 112 tests passing |
| 1.3.4 | User CRUD (admin) | Manual | 2026-01-01 | 121 tests passing |
| 1.4.1 | Dealer list view | Manual | 2026-01-01 | 152 tests passing |
| 1.4.2 | Dealer CRUD | Manual | 2026-01-01 | 163 tests passing |
| 1.4.3 | Dealer detail page | Manual | 2026-01-01 | 173 tests, tabs (Overview, Users, Orders, Contacts, Settings) |
| 1.4.4 | Dealer onboarding wizard | Manual | 2026-01-01 | 204 tests, 4-step wizard (Basic Info, Business Details, Contacts, Review) |

---

## In Progress

<!-- Move active Ralph loops here -->

| ID | Task | Started | Current Iteration | Status |
|----|------|---------|-------------------|--------|
| - | - | - | - | - |

---

## Task Dependencies

```
Phase 0 ──┬──▶ Phase 1 ──┬──▶ Phase 3 ──▶ Phase 4
          │              │
          │              └──▶ Phase 2 ──┘
          │
          └──────────────────────────────▶ Phase 5 ──▶ Phase 6 ──▶ Phase 7
```

### Critical Path

1. **0.1.1** → Next.js Setup (blocks all development)
2. **0.3.2** → Database Schema (blocks most features)
3. **1.1.1** → Authentication (blocks protected features)
4. **1.2.1** → RBAC (blocks permission-gated features)
5. **3.3.1** → Order Service (blocks order workflow)
6. **6.4.1** → Security Audit (blocks production launch)
7. **7.1.1** → Production Infrastructure (blocks deployment)

---

## Effort Estimates

| Phase | Tasks | Total Iterations | Estimated Hours* |
|-------|-------|------------------|------------------|
| Phase 0 | 16 | 160 | 40 |
| Phase 1 | 18 | 225 | 56 |
| Phase 2 | 14 | 175 | 44 |
| Phase 3 | 18 | 230 | 58 |
| Phase 4 | 14 | 170 | 43 |
| Phase 5 | 14 | 160 | 40 |
| Phase 6 | 13 | 165 | 41 |
| Phase 7 | 10 | 130 | 33 |
| **Total** | **117** | **1415** | **355** |

*Assuming ~4 iterations per hour with Ralph Wiggum

---

## Notes & Guidelines

### Starting a Task

1. Find task in backlog by ID
2. Move to "In Progress" section
3. Copy the command
4. Run with appropriate `--max-iterations`
5. Monitor progress in `.ralph/progress.md`

### Completing a Task

1. Run tests: `npm test`
2. Update task status to ✅ in backlog
3. Add entry to "Completed Tasks" section
4. Delete `.ralph/progress.md` if used
5. Commit with task ID in message

### Push Checklist

Before every push, verify:

- [ ] All tests pass (`npm test`)
- [ ] Task status updated in this file
- [ ] Completed Tasks section updated
- [ ] No `.ralph/progress.md` left behind (unless loop active)
- [ ] Commit message includes task ID if applicable

### Best Practices

- Always read the task description carefully
- Set up progress tracking for tasks >15 iterations
- Commit checkpoints every 5-10 iterations
- Run tests before marking complete
- Update this backlog when done

### When to Create New Tasks

- Discovered dependency not in backlog
- Bug found during development
- Technical debt to address
- Enhancement opportunity identified

---

*Document Version: 2.1*
*Last Updated: 2026-01-01*
