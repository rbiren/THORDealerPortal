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
| 1.4.5 | 🟡 | ✅ | Add dealer hierarchy | Manual | *Completed 2026-01-01 (215 tests passing)* |

### 1.5 Audit Logging

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 1.5.1 | 🟠 | ✅ | Implement audit log service | Manual | *Completed 2026-01-01 (235 tests passing)* |
| 1.5.2 | 🟠 | ✅ | Build audit log viewer | Manual | *Completed 2026-01-01 (266 tests passing)* |

---

## Phase 2: Inventory & Products

**Timeline**: Weeks 6-8
**Goal**: Product catalog and inventory visibility

### 2.1 Product Catalog

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.1.1 | 🔴 | ✅ | Create product list view | Manual | *Completed 2026-01-01 (299 tests passing)* |
| 2.1.2 | 🔴 | ✅ | Implement product search | Manual | *Completed 2026-01-01 (322 tests passing)* |
| 2.1.3 | 🔴 | ✅ | Build product filters | Manual | *Completed 2026-01-01 (filter chips, clear all, URL sync)* |
| 2.1.4 | 🟠 | ✅ | Create product detail page | Manual | *Completed 2026-01-01 (344 tests passing)* |
| 2.1.5 | 🟠 | ✅ | Implement category navigation | Manual | *Completed 2026-01-01 (359 tests passing)* |

### 2.2 Product Management (Admin)

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.2.1 | 🟠 | ✅ | Build product CRUD | Manual | *Completed 2026-01-01 (390 tests passing)* |
| 2.2.2 | 🟠 | ✅ | Implement category management | Manual | *Completed 2026-01-01 (413 tests passing)* |
| 2.2.3 | 🟡 | ⏳ | Add bulk product import | 15 | `/ralph-loop "Create CSV/Excel product import: template download, file upload, validation preview, import with error handling. Show progress" --max-iterations 15` |

### 2.3 Inventory Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 2.3.1 | 🔴 | ✅ | Create inventory dashboard | Manual | *Completed 2026-01-01 (439 tests passing)* |
| 2.3.2 | 🟠 | ✅ | Implement inventory list | Manual | *Completed 2026-01-01 (464 tests passing)* |
| 2.3.3 | 🟠 | ✅ | Build location management | Manual | *Completed 2026-01-01 (487 tests passing)* |
| 2.3.4 | 🟠 | ✅ | Add inventory adjustments | Manual | *Completed 2026-01-01 (506 tests passing)* |
| 2.3.5 | 🟡 | ✅ | Create low stock alerts | Manual | *Completed 2026-01-01 (533 tests passing)* |

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
| 3.1.1 | 🔴 | ✅ | Implement cart state management | Manual | *Completed 2026-01-01 (578 tests passing)* |
| 3.1.2 | 🔴 | ✅ | Build cart UI components | Manual | *Completed 2026-01-01 (578 tests passing)* |
| 3.1.3 | 🟠 | ✅ | Add cart validation | Manual | *Completed with 3.1.1 (validateCart in actions.ts)* |
| 3.1.4 | 🟡 | ✅ | Create saved carts feature | Manual | *Completed with 3.1.1 (save/restore in actions.ts)* |

### 3.2 Checkout Flow

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.2.1 | 🔴 | ✅ | Build checkout page | Manual | *Completed 2026-01-01 (615 tests passing)* |
| 3.2.2 | 🔴 | ✅ | Implement address selection | Manual | *Completed with 3.2.1 (ShippingAddressStep)* |
| 3.2.3 | 🟠 | ✅ | Create order summary component | Manual | *Completed with 3.2.1 (ReviewConfirmStep)* |
| 3.2.4 | 🟠 | ✅ | Add checkout validation | Manual | *Completed with 3.2.1 (PaymentStep)* |

### 3.3 Order Processing

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.3.1 | 🔴 | ✅ | Create order service | Manual | *Completed 2026-01-01 (664 tests passing)* |
| 3.3.2 | 🔴 | ✅ | Implement order confirmation | Manual | *Completed 2026-01-01 (confirmation page, email)* |
| 3.3.3 | 🟠 | ✅ | Build order status updates | Manual | *Completed 2026-01-01 (workflow, notifications)* |
| 3.3.4 | 🟠 | ✅ | Create order cancellation | Manual | *Completed with 3.3.3 (cancel modal, inventory release)* |

### 3.4 Order History & Tracking

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.4.1 | 🔴 | ✅ | Build order list page | Manual | *Completed 2026-01-01 (filters, pagination, stats)* |
| 3.4.2 | 🔴 | ✅ | Create order detail page | Manual | *Completed 2026-01-01 (items, timeline, reorder)* |
| 3.4.3 | 🟠 | ✅ | Implement order search | Manual | *Completed with 3.4.1 (order/PO search)* |
| 3.4.4 | 🟡 | ⏳ | Add shipping tracking | 12 | `/ralph-loop "Integrate shipping carrier tracking: fetch tracking info, display delivery status, estimated delivery. Support multiple carriers" --max-iterations 12` |

### 3.5 Invoice Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.5.1 | 🟠 | ✅ | Create invoice generation | Manual | *Completed 2026-01-01 (697 tests passing)* |
| 3.5.2 | 🟠 | ✅ | Build invoice list | Manual | *Completed 2026-01-01 (filters, stats, pagination)* |
| 3.5.3 | 🟡 | ✅ | Add invoice email delivery | Manual | *Completed 2026-01-01 (email, print, mark paid)* |

### 3.6 Admin Order Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 3.6.1 | 🟠 | ✅ | Build admin order list | Manual | *Completed 2026-01-01 (741 tests passing)* |
| 3.6.2 | 🟠 | ✅ | Add order editing | Manual | *Completed 2026-01-01 (inline item editing, price updates)* |
| 3.6.3 | 🟡 | ✅ | Create order notes | Manual | *Completed 2026-01-01 (internal/external visibility)* |

---

## Phase 4: Reporting & Analytics

**Timeline**: Weeks 13-15
**Goal**: Data insights for dealers and admins

### 4.1 Dealer Dashboard

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.1.1 | 🔴 | ✅ | Create dealer dashboard layout | Manual | *Completed 2026-01-01 (781 tests passing)* |
| 4.1.2 | 🔴 | ✅ | Add sales metrics cards | Manual | *Completed 2026-01-01 (MTD, YTD, growth %, avg order)* |
| 4.1.3 | 🟠 | ✅ | Build recent activity feed | Manual | *Completed 2026-01-01 (orders, invoices, status changes)* |
| 4.1.4 | 🟠 | ✅ | Add quick actions panel | Manual | *Completed 2026-01-01 (new order, browse, orders, invoices)* |

### 4.2 Sales Reports

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.2.1 | 🔴 | ✅ | Create sales summary report | Manual | *Completed 2026-01-01 (825 tests passing)* |
| 4.2.2 | 🟠 | ✅ | Add product sales breakdown | Manual | *Completed 2026-01-01 (top products, category breakdown)* |
| 4.2.3 | 🟠 | ✅ | Build comparison reports | Manual | *Completed 2026-01-01 (period comparison, growth %)* |
| 4.2.4 | 🟡 | ⏳ | Add sales forecasting | 15 | `/ralph-loop "Implement basic sales forecasting: trend analysis, seasonal patterns, projected values. Show confidence intervals" --max-iterations 15` |

### 4.3 Inventory Reports

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.3.1 | 🟠 | ✅ | Create inventory value report | Manual | *Completed 2026-01-01 (867 tests passing)* |
| 4.3.2 | 🟠 | ✅ | Add inventory turnover report | Manual | *Completed 2026-01-01 (turnover rate, days of supply)* |
| 4.3.3 | 🟡 | ✅ | Build inventory aging report | Manual | *Completed 2026-01-01 (age buckets, aging summary)* |

### 4.4 Admin Analytics

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.4.1 | 🟠 | ✅ | Create admin analytics dashboard | Manual | *Completed 2026-01-01 (901 tests passing)* |
| 4.4.2 | 🟠 | ✅ | Add dealer comparison | Manual | *Completed 2026-01-01 (dealer ranking, tier distribution)* |
| 4.4.3 | 🟡 | ✅ | Build system usage analytics | Manual | *Completed 2026-01-01 (active users, carts, logins)* |

### 4.5 Export & Scheduling

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.5.1 | 🟠 | ✅ | Implement report export | Manual | *Completed 2026-01-01 (950 tests passing)* |
| 4.5.2 | 🟡 | ⏳ | Create scheduled reports | 15 | `/ralph-loop "Build report scheduling: frequency (daily/weekly/monthly), recipients, format. Email delivery with attachments" --max-iterations 15` |
| 4.5.3 | 🟡 | ⏳ | Add custom report builder | 20 | `/ralph-loop "Create drag-drop report builder: select metrics, dimensions, filters, visualizations. Save custom reports" --max-iterations 20` |

---

## Phase 5: Documents & Notifications

**Timeline**: Weeks 16-18
**Goal**: Document management and communication

### 5.1 Document Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.1.1 | 🔴 | ✅ | Build document library | Manual | *Completed 2026-01-01 (1058 tests passing)* |
| 5.1.2 | 🔴 | ✅ | Implement file upload | Manual | *Completed 2026-01-01 (1101 tests passing)* |
| 5.1.3 | 🟠 | ⏳ | Add document preview | 12 | `/ralph-loop "Implement document preview: PDF viewer, image lightbox, Office document preview. In-modal viewing without download" --max-iterations 12` |
| 5.1.4 | 🟠 | ⏳ | Create version control | 12 | `/ralph-loop "Add document versioning: upload new version, version history, restore previous. Track changes and uploaders" --max-iterations 12` |
| 5.1.5 | 🟡 | ⏳ | Implement access control | 10 | `/ralph-loop "Create document permissions: public, dealer-specific, role-based. Admin override capability. Audit access logs" --max-iterations 10` |
| 5.1.6 | 🟡 | ⏳ | Add expiration tracking | 8 | `/ralph-loop "Implement document expiration: set expiry dates, renewal reminders, expired document handling. Dashboard widget" --max-iterations 8` |

### 5.2 Notification System

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.2.1 | 🔴 | ✅ | Create notification service | Manual | *Completed 2026-01-01 (1002 tests passing)* |
| 5.2.2 | 🔴 | ✅ | Build in-app notifications | Manual | *Completed 2026-01-01 (bell icon, dropdown, full page)* |
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
| 1.4.5 | Dealer hierarchy visualization | Manual | 2026-01-01 | 215 tests, tree view, filters, search, stats |
| 1.5.1 | Audit log service | Manual | 2026-01-01 | 235 tests, logCreate/Update/Delete helpers, query functions |
| 1.5.2 | Audit log viewer | Manual | 2026-01-01 | 266 tests, filters (user/action/entity/date), pagination, detail expansion |
| 2.1.1 | Product list view | Manual | 2026-01-01 | 299 tests, grid/list toggle, filters (category/status/price/stock), pagination |
| 2.1.2 | Product search | Manual | 2026-01-01 | 322 tests, autocomplete dropdown, search history, relevance scoring |
| 2.1.3 | Product filters | Manual | 2026-01-01 | Filter chips, removable tags, clear all, URL parameter sync |
| 2.1.4 | Product detail page | Manual | 2026-01-01 | 344 tests, image gallery, specifications, inventory by location, related products |
| 2.1.5 | Category navigation | Manual | 2026-01-01 | 359 tests, hierarchical sidebar, product counts, expand/collapse, active highlight |
| 2.2.1 | Product CRUD (Admin) | Manual | 2026-01-01 | 390 tests, create/edit forms, image management, bulk actions, admin table |
| 2.2.2 | Category Management | Manual | 2026-01-01 | 413 tests, CRUD with tree view, drag-drop reorder, 3-level nesting, parent validation |
| 2.3.1 | Inventory Dashboard | Manual | 2026-01-01 | 439 tests, summary cards, location breakdown, low/out-of-stock alerts, category breakdown |
| 2.3.2 | Inventory List | Manual | 2026-01-01 | 464 tests, filterable table, search/sort, pagination, CSV export |
| 2.3.3 | Location Management | Manual | 2026-01-01 | 487 tests, CRUD for warehouse/store/DC, toggle active status |
| 2.3.4 | Inventory Adjustments | Manual | 2026-01-01 | 506 tests, add/remove/set stock, reason codes, audit trail |
| 2.3.5 | Low Stock Alerts | Manual | 2026-01-01 | 533 tests, severity levels, notification preferences, bulk acknowledge |
| 3.1.1 | Cart State Management | Manual | 2026-01-01 | 578 tests, Zustand store, localStorage persistence, server sync, saved carts |
| 3.1.2 | Cart UI Components | Manual | 2026-01-01 | CartIcon, CartDrawer, CartPage, CartItemRow, AddToCartButton |
| 3.1.3 | Cart Validation | Manual | 2026-01-01 | Stock/availability checks, price validation, issue warnings |
| 3.1.4 | Saved Carts Feature | Manual | 2026-01-01 | Save/name carts, list saved, restore to active cart |
| 3.2.1 | Checkout Page | Manual | 2026-01-01 | 615 tests, multi-step flow, progress indicator |
| 3.2.2 | Address Selection | Manual | 2026-01-01 | Saved addresses, new address form, validation |
| 3.2.3 | Order Summary Component | Manual | 2026-01-01 | Items, subtotal, tax, shipping, total |
| 3.2.4 | Checkout Validation | Manual | 2026-01-01 | Payment methods, PO number, order notes |
| 3.3.1 | Order Service | Manual | 2026-01-01 | 664 tests, create/validate/reserve inventory, totals |
| 3.3.2 | Order Confirmation | Manual | 2026-01-01 | Confirmation page, email notification |
| 3.3.3 | Order Status Updates | Manual | 2026-01-01 | Status workflow, progress timeline, notifications |
| 3.3.4 | Order Cancellation | Manual | 2026-01-01 | Cancel modal, inventory release, validation |
| 3.4.1 | Order List Page | Manual | 2026-01-01 | Filters, pagination, stats cards |
| 3.4.2 | Order Detail Page | Manual | 2026-01-01 | Items, timeline, shipping, reorder |
| 3.4.3 | Order Search | Manual | 2026-01-01 | Order/PO number search |
| 3.5.1 | Invoice Generation | Manual | 2026-01-01 | 697 tests, HTML templates, print support |
| 3.5.2 | Invoice List | Manual | 2026-01-01 | Filters, stats, pagination |
| 3.5.3 | Invoice Email Delivery | Manual | 2026-01-01 | Email templates, mark paid, print |
| 3.6.1 | Admin Order List | Manual | 2026-01-01 | 741 tests, all orders, advanced filters, bulk actions, CSV export |
| 3.6.2 | Order Editing | Manual | 2026-01-01 | Inline item editing, price updates, quantity changes |
| 3.6.3 | Order Notes | Manual | 2026-01-01 | Internal/external visibility, note timeline |
| 4.1.1 | Dealer Dashboard Layout | Manual | 2026-01-01 | 781 tests, card-based layout, responsive grid |
| 4.1.2 | Sales Metrics Cards | Manual | 2026-01-01 | MTD, YTD, growth %, average order value |
| 4.1.3 | Recent Activity Feed | Manual | 2026-01-01 | Orders, invoices, status changes timeline |
| 4.1.4 | Quick Actions Panel | Manual | 2026-01-01 | New order, browse, orders, invoices shortcuts |
| 4.2.1 | Sales Summary Report | Manual | 2026-01-01 | 825 tests, date range, totals, growth indicators |
| 4.2.2 | Product Sales Breakdown | Manual | 2026-01-01 | Top products by revenue/quantity, category breakdown |
| 4.2.3 | Comparison Reports | Manual | 2026-01-01 | Period comparison, growth %, avg order value comparison |
| 4.3.1 | Inventory Value Report | Manual | 2026-01-01 | 867 tests, value by location/category, cost vs retail |
| 4.3.2 | Inventory Turnover Report | Manual | 2026-01-01 | Turnover rate, days of supply, fast/slow movers |
| 4.3.3 | Inventory Aging Report | Manual | 2026-01-01 | Age buckets (30/60/90/120+ days), aging summary |
| 4.4.1 | Admin Analytics Dashboard | Manual | 2026-01-01 | 901 tests, network stats, revenue trend, top products |
| 4.4.2 | Dealer Comparison | Manual | 2026-01-01 | Dealer ranking by revenue/orders/growth, tier distribution |
| 4.4.3 | System Usage Analytics | Manual | 2026-01-01 | Active users, today logins, active carts |
| 4.5.1 | Report Export | Manual | 2026-01-01 | 950 tests, CSV/Excel/PDF export, sales/inventory/dealer reports |
| 5.2.1 | Notification Service | Manual | 2026-01-01 | 1002 tests, CRUD, templates, bulk creation, cleanup |
| 5.2.2 | In-App Notifications | Manual | 2026-01-01 | Bell icon, dropdown, full page, grouping, filters |
| 5.1.1 | Document Library | Manual | 2026-01-01 | 1058 tests, grid/list view, categories, search, filters |
| 5.1.2 | File Upload | Manual | 2026-01-01 | 1101 tests, drag-drop, progress, validation, quota |

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
