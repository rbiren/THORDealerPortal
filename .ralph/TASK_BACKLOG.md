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

### 4.6 Inventory Forecasting Module

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.1 | 🔴 | ✅ | Design forecasting schema | Manual | *Completed 2026-01-01 - 5 models: ForecastConfig, DemandForecast, SuggestedOrder, SeasonalPattern, MarketIndicator* |
| 4.6.2 | 🔴 | ✅ | Build demand analysis algorithms | Manual | *Completed 2026-01-01 - Trend, seasonality, outlier detection, confidence intervals* |
| 4.6.3 | 🔴 | ✅ | Create forecasting service | Manual | *Completed 2026-01-01 - 18-month horizon, order recommendations, EOQ calculation* |
| 4.6.4 | 🔴 | ✅ | Build forecasting API routes | Manual | *Completed 2026-01-01 - /api/forecasting/config, /demand, /orders, /market* |
| 4.6.5 | 🔴 | ✅ | Create forecasting dashboard UI | Manual | *Completed 2026-01-01 - Summary cards, charts, timeline visualization* |
| 4.6.6 | 🔴 | ✅ | Build order plan table component | Manual | *Completed 2026-01-01 - Sortable, filterable, expandable rows* |
| 4.6.7 | 🟠 | ✅ | Create market analysis component | Manual | *Completed 2026-01-01 - Regional indicators, impact assessment* |
| 4.6.8 | 🟠 | ✅ | Write forecasting tests | Manual | *Completed 2026-01-01 - 27 tests for algorithms and DB models* |
| 4.6.9 | 🟡 | ⏳ | Integrate with dealer dashboard | 10 | `/ralph-loop "Add forecasting widget to dealer dashboard. Show upcoming orders, demand trends. Link to full forecasting page" --max-iterations 10` |
| 4.6.10 | 🟡 | ⏳ | Add product-level forecast details | 12 | `/ralph-loop "Create product forecast detail view. Show 18-month projections per product. Allow custom adjustments" --max-iterations 12` |
| 4.6.11 | 🟢 | ⏳ | Implement forecast accuracy tracking | 10 | `/ralph-loop "Track forecast vs actual. Calculate MAPE, MAE. Show accuracy metrics. Auto-tune models based on errors" --max-iterations 10` |

#### 4.6.A Advanced Algorithms Enhancement

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.12 | 🟠 | ⏳ | Implement Holt-Winters exponential smoothing | 15 | `/ralph-loop "Implement Holt-Winters triple exponential smoothing in demand-analyzer.ts: Add HoltWintersParams interface (alpha, beta, gamma, seasonLength), Create holtWintersSmoothing() function with level/trend/seasonal components, Add optimizeHoltWintersParams() using grid search, Support both multiplicative and additive seasonality. Write unit tests for each function. All tests must pass" --max-iterations 15 --completion-promise "HOLT-WINTERS COMPLETE"` |
| 4.6.13 | 🟠 | ⏳ | Add weighted moving average with adaptive weights | 10 | `/ralph-loop "Add weighted moving average to demand-analyzer.ts: Create calculateWeightedMA() with configurable weight profiles, Add weight presets: recent-heavy, balanced, linear-decay, Implement adaptive weights based on forecast errors. Add unit tests. All tests must pass" --max-iterations 10 --completion-promise "WMA COMPLETE"` |
| 4.6.14 | 🟡 | ⏳ | Create demand decomposition (trend/seasonal/residual) | 12 | `/ralph-loop "Create demand decomposition in demand-analyzer.ts: Add decomposeTimeSeries() function (trend, seasonal, residual), Use moving average for trend extraction, Calculate seasonal indices from detrended data, Return DecompositionResult with all components, Add visualization data format. Write comprehensive tests. All tests must pass" --max-iterations 12 --completion-promise "DECOMPOSITION COMPLETE"` |
| 4.6.15 | 🟡 | ⏳ | Add demand variability analysis (CV, ADI, Croston) | 12 | `/ralph-loop "Add demand variability analysis to demand-analyzer.ts: Calculate coefficient of variation (CV), Compute average demand interval (ADI) for intermittent demand, Implement Croston's method for lumpy demand, Add demandClassification() returning 'smooth'|'erratic'|'intermittent'|'lumpy'. Write unit tests for each scenario. All tests must pass" --max-iterations 12 --completion-promise "VARIABILITY ANALYSIS COMPLETE"` |

#### 4.6.B Accuracy & Auto-Tuning Enhancement

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.16 | 🔴 | ⏳ | Build accuracy metrics system (MAPE, MAE, RMSE) | 12 | `/ralph-loop "Build forecast accuracy metrics system: Create src/lib/services/forecasting/accuracy-tracker.ts, Add calculateMAPE(), calculateMAE(), calculateRMSE(), calculateBias(), Create tracking signal calculation for control limits, Build accuracy summary aggregation by product/category. Write comprehensive unit tests. All tests must pass" --max-iterations 12 --completion-promise "ACCURACY METRICS COMPLETE"` |
| 4.6.17 | 🔴 | ⏳ | Implement forecast vs actual tracking | 10 | `/ralph-loop "Implement forecast vs actual tracking: Add updateActualDemand() to forecasting-service.ts, Create job/hook to capture actuals from confirmed orders, Update DemandForecast.actualDemand and forecastError fields, Add getAccuracyHistory() for dashboard, Create accuracy trends visualization data. Write integration tests. All tests must pass" --max-iterations 10 --completion-promise "ACTUALS TRACKING COMPLETE"` |
| 4.6.18 | 🟠 | ⏳ | Create auto-tuning engine for parameters | 15 | `/ralph-loop "Create auto-tuning engine for forecast parameters: Add src/lib/services/forecasting/auto-tuner.ts, Implement grid search for optimal parameters, Select best algorithm per product based on backtest, Update ForecastConfig with tuned parameters, Add tuning history tracking. Write tests for tuning logic. All tests must pass" --max-iterations 15 --completion-promise "AUTO-TUNER COMPLETE"` |
| 4.6.19 | 🟡 | ⏳ | Add anomaly detection and alerts | 10 | `/ralph-loop "Add demand anomaly detection and alerts: Create detectDemandAnomalies() using statistical methods, Add anomaly flags to forecasts, Create Notification records for significant deviations, Build anomaly summary for dashboard. Write unit tests. All tests must pass" --max-iterations 10 --completion-promise "ANOMALY DETECTION COMPLETE"` |

#### 4.6.C Scenario Planning Enhancement

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.20 | 🟠 | ⏳ | Build what-if analysis feature | 15 | `/ralph-loop "Build what-if analysis feature: Add src/lib/services/forecasting/scenario-planner.ts, Create simulateScenario() with adjustable parameters, Return modified forecasts without saving to DB, Add scenario comparison data structure, Create API endpoint /api/forecasting/scenarios, Build basic scenario UI component. Write tests. All tests must pass" --max-iterations 15 --completion-promise "WHAT-IF COMPLETE"` |
| 4.6.21 | 🟡 | ⏳ | Create scenario templates (optimistic/pessimistic) | 10 | `/ralph-loop "Create scenario templates: Add predefined scenarios: optimistic (+20%), pessimistic (-20%), most_likely, Create seasonal spike template, Add supply disruption template (extended lead times), Store templates in database or config, Add template selection to UI. Write tests. All tests must pass" --max-iterations 10 --completion-promise "SCENARIO TEMPLATES COMPLETE"` |
| 4.6.22 | 🟢 | ⏳ | Add sensitivity analysis visualization | 12 | `/ralph-loop "Add sensitivity analysis visualization: Create calculateSensitivity() for key parameters, Show how forecast changes with parameter variations, Generate tornado chart data, Add sensitivity tab to forecasting dashboard. Write tests. All tests must pass" --max-iterations 12 --completion-promise "SENSITIVITY COMPLETE"` |

#### 4.6.D Inventory Classification Enhancement

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.23 | 🟠 | ⏳ | Implement ABC analysis for inventory | 10 | `/ralph-loop "Implement ABC analysis for inventory: Add src/lib/services/forecasting/inventory-classifier.ts, Create performABCAnalysis() based on revenue/margin, Calculate cumulative percentages for Pareto, Assign A (top 80%), B (next 15%), C (bottom 5%), Add classification to product data, Create ABC summary visualization data. Write tests. All tests must pass" --max-iterations 10 --completion-promise "ABC ANALYSIS COMPLETE"` |
| 4.6.24 | 🟠 | ⏳ | Add XYZ analysis and ABC-XYZ matrix | 10 | `/ralph-loop "Add XYZ analysis and ABC-XYZ matrix: Create performXYZAnalysis() based on demand CV, X (CV < 0.5), Y (0.5 <= CV < 1.0), Z (CV >= 1.0), Build combined ABC-XYZ matrix (9 segments), Add forecasting strategy recommendations per segment, Create matrix visualization data. Write tests. All tests must pass" --max-iterations 10 --completion-promise "XYZ MATRIX COMPLETE"` |
| 4.6.25 | 🟡 | ⏳ | Create product lifecycle stage detection | 12 | `/ralph-loop "Create product lifecycle stage detection: Add detectLifecycleStage() analyzing trend patterns, Stages: introduction, growth, maturity, decline, Calculate months in each stage, Add lifecycle-appropriate forecast adjustments, Handle new products with analogous product mapping. Write tests. All tests must pass" --max-iterations 12 --completion-promise "LIFECYCLE DETECTION COMPLETE"` |

#### 4.6.E Ultra Test Suite Enhancement

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 4.6.26 | 🔴 | ⏳ | Ultra algorithm unit tests (edge cases) | 15 | `/ralph-loop "Create ultra comprehensive algorithm tests: Edge cases: empty data, single point, all zeros, negative values, Sparse data: missing months, irregular intervals, Seasonal pattern edge cases: weak patterns, multi-year patterns, Trend edge cases: flat, exponential, step changes, Confidence interval coverage validation, Outlier detection accuracy. Minimum 50 test cases. All tests must pass" --max-iterations 15 --completion-promise "ULTRA ALGORITHM TESTS COMPLETE"` |
| 4.6.27 | 🔴 | ⏳ | Integration tests for API routes | 12 | `/ralph-loop "Create comprehensive API integration tests: Test all /api/forecasting/* endpoints, Test with valid and invalid inputs, Test concurrent requests, Test large payload handling, End-to-end flow: config -> forecast -> orders. Minimum 30 integration tests. All tests must pass" --max-iterations 12 --completion-promise "INTEGRATION TESTS COMPLETE"` |
| 4.6.28 | 🟡 | ⏳ | Performance and load testing | 10 | `/ralph-loop "Add performance and load testing: Create tests/performance/forecasting.perf.ts, Simulate 1000 products forecast generation, Measure memory usage and execution time, Set performance thresholds (e.g., <5s for 100 products), Test database query efficiency, Document performance baselines. All tests must pass" --max-iterations 10 --completion-promise "PERFORMANCE TESTS COMPLETE"` |

---

## Phase 5: Documents & Notifications

**Timeline**: Weeks 16-18
**Goal**: Document management and communication

### 5.1 Document Management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.1.1 | 🔴 | ✅ | Build document library | Manual | *Completed 2026-01-01 (1058 tests passing)* |
| 5.1.2 | 🔴 | ✅ | Implement file upload | Manual | *Completed 2026-01-01 (1101 tests passing)* |
| 5.1.3 | 🟠 | ✅ | Add document preview | Manual | *Completed 2026-01-01 (1161 tests passing)* |
| 5.1.4 | 🟠 | ✅ | Create version control | Manual | *Completed 2026-01-05 (document versioning service)* |
| 5.1.5 | 🟡 | ✅ | Implement access control | Manual | *Completed 2026-01-05 (access levels, audit logs)* |
| 5.1.6 | 🟡 | ✅ | Add expiration tracking | Manual | *Completed 2026-01-05 (reminders, stats)* |

### 5.2 Notification System

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.2.1 | 🔴 | ✅ | Create notification service | Manual | *Completed 2026-01-01 (1002 tests passing)* |
| 5.2.2 | 🔴 | ✅ | Build in-app notifications | Manual | *Completed 2026-01-01 (bell icon, dropdown, full page)* |
| 5.2.3 | 🟠 | ✅ | Implement email notifications | Manual | *Completed 2026-01-05 (email templates, bulk send)* |
| 5.2.4 | 🟠 | ✅ | Add notification preferences | Manual | *Completed 2026-01-05 (in-app + email prefs)* |
| 5.2.5 | 🟡 | ✅ | Create system announcements | Manual | *Completed 2026-01-05 (targeting, scheduling, receipts)* |

### 5.3 Real-time Updates

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 5.3.1 | 🟡 | ✅ | Setup WebSocket infrastructure | Manual | *Completed 2026-01-05 (SSE, event emitter)* |
| 5.3.2 | 🟡 | ✅ | Add real-time notifications | Manual | *Completed 2026-01-05 (useRealtimeUpdates hook)* |
| 5.3.3 | 🟢 | ✅ | Implement live order updates | Manual | *Completed 2026-01-05 (order status events)* |

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

## Phase 8: Relationship Layer (Dealer/OEM Connective Tissue)

**Timeline**: Post-Launch
**Goal**: Transform from transaction portal to relationship platform

> **Strategic Context**: This phase adds the "soft relationship layer" that makes dealers feel like partners, not just customers. These modules capture:
> - **Communication** - How dealers and OEM talk
> - **Incentives** - Why dealers stay loyal
> - **Training** - How dealers learn products
> - **Performance** - How OEM evaluates dealers

---

### 8.1 Communication Hub

**Purpose**: Centralized dealer-OEM communication channel

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.1.1 | 🔴 | ✅ | Design communication schema | Manual | *Completed 2026-01-05 (SupportTicket, TicketMessage, TicketAttachment, KnowledgeCategory, KnowledgeArticle)* |
| 8.1.2 | 🔴 | ✅ | Build ticket submission flow | Manual | *Completed 2026-01-05 (/support/new page, Zod validation, SLA calculation)* |
| 8.1.3 | 🔴 | ✅ | Create dealer ticket list | Manual | *Completed 2026-01-05 (/support page, filters, pagination, stats)* |
| 8.1.4 | 🔴 | ✅ | Build ticket detail page | Manual | *Completed 2026-01-05 (/support/[ticketNumber] page, message thread, SLA indicators)* |
| 8.1.5 | 🟠 | ⏳ | Build admin ticket queue | 15 | `/ralph-loop "Create admin ticket management: /admin/support page, all tickets across dealers, assign to OEM rep, filter by status/priority/assignee, bulk actions" --max-iterations 15` |
| 8.1.6 | 🟠 | ⏳ | Add ticket assignment/routing | 12 | `/ralph-loop "Implement ticket routing: auto-assign by category, manual reassign, assignment notifications, workload balancing view" --max-iterations 12` |
| 8.1.7 | 🟠 | ⏳ | Create announcement system | 15 | `/ralph-loop "Build announcements: admin create/edit form, target dealer tiers, schedule publish, announcement feed on dealer dashboard, mark as read, critical banner" --max-iterations 15` |
| 8.1.8 | 🟡 | ⏳ | Build knowledge base | 15 | `/ralph-loop "Create knowledge base: /support/kb page, article list by category, article detail, search, admin article CRUD, view count tracking" --max-iterations 15` |
| 8.1.9 | 🟡 | ⏳ | Add SLA tracking | 10 | `/ralph-loop "Implement SLA tracking: configure response/resolution times by priority, track elapsed time, escalation alerts, SLA dashboard for admins" --max-iterations 10` |

---

### 8.2 Incentives & Programs Module

**Purpose**: Manage the financial relationship that drives dealer loyalty

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.2.1 | 🔴 | ✅ | Design incentives schema | Manual | *Completed 2026-01-06 (6 models: IncentiveProgram, DealerProgramEnrollment, RebateAccrual, IncentiveClaim, IncentiveClaimDocument, IncentivePayout)* |
| 8.2.2 | 🔴 | ✅ | Build program admin CRUD | Manual | *Completed 2026-01-06 (/admin/incentives page, list, create, edit, detail views, enrollments tab, claims tab, payouts tab)* |
| 8.2.3 | 🔴 | ✅ | Create dealer enrollment flow | Manual | *Completed 2026-01-06 (/incentives page, program cards, enrollment modal, program detail, withdrawal flow)* |
| 8.2.4 | 🔴 | ✅ | Implement rebate calculation engine | Manual | *Completed 2026-01-06 (batch accrual processing, projected rebates, admin UI for running calculations)* |
| 8.2.5 | 🟠 | ⏳ | Build dealer incentives dashboard | 15 | `/ralph-loop "Create incentives dashboard: /incentives/dashboard, enrolled programs, accrued amounts, pending claims, paid history, program progress visualization" --max-iterations 15` |
| 8.2.6 | 🟠 | ⏳ | Create co-op fund tracking | 15 | `/ralph-loop "Build co-op module: fund balance per dealer, accrual rules, claim submission with receipts, approval workflow, payout tracking" --max-iterations 15` |
| 8.2.7 | 🟠 | ⏳ | Build claim submission workflow | 15 | `/ralph-loop "Create claim flow: /incentives/claims/new, select program, enter amount/details, upload supporting docs, submit for review, track status" --max-iterations 15` |
| 8.2.8 | 🟠 | ⏳ | Add claim approval workflow | 12 | `/ralph-loop "Build admin claim review: /admin/incentives/claims, pending claims queue, review details, approve/deny with notes, batch approval, payout scheduling" --max-iterations 12` |
| 8.2.9 | 🟡 | ⏳ | Create payout reporting | 10 | `/ralph-loop "Build payout reports: payout history, scheduled payouts, export for finance, dealer payout statements" --max-iterations 10` |

---

### 8.3 Training & Certification Portal

**Purpose**: Ensure dealers are properly trained to sell and service products

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.3.1 | 🔴 | ⏳ | Design training schema | 15 | `/ralph-loop "Create Prisma schema for Training: TrainingCourse, CourseContent, Quiz, QuizQuestion, Certification, TrainingAssignment, CourseProgress. Add relations, indexes" --max-iterations 15` |
| 8.3.2 | 🔴 | ⏳ | Build course catalog | 15 | `/ralph-loop "Create course catalog: /training page, course cards with thumbnail/duration/category, filter by category/required, search, course detail page" --max-iterations 15` |
| 8.3.3 | 🔴 | ⏳ | Create course content viewer | 15 | `/ralph-loop "Build content viewer: /training/[courseId] page, video player, PDF viewer, progress tracking, mark complete, next/prev navigation" --max-iterations 15` |
| 8.3.4 | 🔴 | ⏳ | Implement quiz engine | 18 | `/ralph-loop "Build quiz system: question types (multiple choice, true/false), timed quizzes, score calculation, passing threshold, retry logic, certificate generation on pass" --max-iterations 18` |
| 8.3.5 | 🟠 | ⏳ | Build certification tracking | 12 | `/ralph-loop "Create cert tracking: /training/certifications page, my certifications, expiration dates, renewal reminders, download certificate PDF" --max-iterations 12` |
| 8.3.6 | 🟠 | ⏳ | Add training assignment workflow | 12 | `/ralph-loop "Build assignments: dealer admin assigns courses to staff, due dates, progress tracking, reminder emails, completion notifications" --max-iterations 12` |
| 8.3.7 | 🟠 | ⏳ | Create compliance dashboard | 15 | `/ralph-loop "Build compliance view: /admin/training/compliance, dealer certification rates, expiring certs (30/60/90 days), required course completion, export compliance report" --max-iterations 15` |
| 8.3.8 | 🟠 | ⏳ | Build course admin CRUD | 12 | `/ralph-loop "Create course management: /admin/training/courses, create/edit courses, upload content, set requirements, set expiration, quiz builder" --max-iterations 12` |
| 8.3.9 | 🟡 | ⏳ | Add training analytics | 10 | `/ralph-loop "Build training analytics: completion rates, avg quiz scores, most/least popular courses, time to complete, dealer training trends" --max-iterations 10` |

---

### 8.4 Dealer Performance Scorecard

**Purpose**: Data-driven dealer evaluation and tier management

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.4.1 | 🔴 | ⏳ | Design scorecard schema | 12 | `/ralph-loop "Create Prisma schema: DealerScorecard, PerformanceMetric, SalesTarget, ScoreWeight, TierThreshold. Monthly scorecard snapshots with all KPIs" --max-iterations 12` |
| 8.4.2 | 🔴 | ⏳ | Build metric calculation engine | 18 | `/ralph-loop "Create scorecard engine: calculate sales vs target, YoY growth, warranty rate, training compliance, inventory turn, payment terms. Composite score with configurable weights" --max-iterations 18` |
| 8.4.3 | 🔴 | ⏳ | Create dealer scorecard view | 15 | `/ralph-loop "Build dealer scorecard: /performance page, current scores with gauges, 12-month trend charts, metric breakdowns, tier status, improvement suggestions" --max-iterations 15` |
| 8.4.4 | 🟠 | ⏳ | Build admin network view | 15 | `/ralph-loop "Create network performance: /admin/performance page, all dealers ranked, filter by tier/region, export rankings, identify at-risk dealers, top performers" --max-iterations 15` |
| 8.4.5 | 🟠 | ⏳ | Add tier recommendation engine | 12 | `/ralph-loop "Build tier logic: automatic tier promotion/demotion recommendations based on sustained performance, tier change notifications, admin override" --max-iterations 12` |
| 8.4.6 | 🟠 | ⏳ | Create target management | 12 | `/ralph-loop "Build target setting: /admin/performance/targets, set sales targets by dealer/region, import targets from CSV, target vs actual tracking" --max-iterations 12` |
| 8.4.7 | 🟡 | ⏳ | Add benchmark comparisons | 10 | `/ralph-loop "Build benchmarking: compare dealer to tier average, regional average, network average. Percentile rankings. Peer group analysis" --max-iterations 10` |
| 8.4.8 | 🟡 | ⏳ | Create scorecard history | 10 | `/ralph-loop "Build historical view: monthly scorecard archive, trend analysis, improvement trajectory, YoY comparisons" --max-iterations 10` |

---

### 8.5 Parts & Service Module (Priority 2)

**Purpose**: Post-sale support and parts ordering

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.5.1 | 🟠 | ⏳ | Design parts schema | 12 | `/ralph-loop "Create schema: Part (separate from Product), PartCategory, PartsOrder, ServiceBulletin, TechnicalSupportRequest, RecallNotice" --max-iterations 12` |
| 8.5.2 | 🟠 | ⏳ | Build parts catalog | 15 | `/ralph-loop "Create parts catalog: /parts page, search by part number/name/VIN, filter by category, add to cart, quick order from history" --max-iterations 15` |
| 8.5.3 | 🟡 | ⏳ | Create service bulletins | 12 | `/ralph-loop "Build TSB module: /parts/bulletins page, list by severity/date, detail view with PDF, affected units, acknowledge read" --max-iterations 12` |
| 8.5.4 | 🟡 | ⏳ | Add recall management | 12 | `/ralph-loop "Build recall tracking: /parts/recalls, active recalls, affected inventory, completion tracking, dealer action required" --max-iterations 12` |
| 8.5.5 | 🟢 | ⏳ | Create parts RMA | 10 | `/ralph-loop "Build RMA workflow: request return authorization, reason codes, approval workflow, return shipping, credit tracking" --max-iterations 10` |

---

### 8.6 Marketing Asset Library (Priority 2)

**Purpose**: Help dealers sell more effectively

| ID | Priority | Status | Task | Iterations | Command |
|----|----------|--------|------|------------|---------|
| 8.6.1 | 🟠 | ⏳ | Design assets schema | 10 | `/ralph-loop "Create schema: MarketingAsset, AssetCategory, AssetDownload, CampaignTemplate. Support images, videos, PDFs, branding files" --max-iterations 10` |
| 8.6.2 | 🟠 | ⏳ | Build asset library | 15 | `/ralph-loop "Create asset library: /marketing page, browse by category, search, preview, download, filter by asset type/brand/campaign" --max-iterations 15` |
| 8.6.3 | 🟡 | ⏳ | Add co-branding tools | 15 | `/ralph-loop "Build co-branding: select template, add dealer logo/info, preview, generate PDF/image, download. Basic customization UI" --max-iterations 15` |
| 8.6.4 | 🟡 | ⏳ | Create asset admin | 12 | `/ralph-loop "Build asset management: /admin/marketing, upload assets, set categories/tags, set availability (all dealers vs tier-specific), usage tracking" --max-iterations 12` |
| 8.6.5 | 🟢 | ⏳ | Add usage analytics | 8 | `/ralph-loop "Build analytics: most downloaded assets, downloads by dealer, asset performance, popular campaigns" --max-iterations 8` |

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
| 1.4.3 | Dealer detail page | Manual | 2026-01-01 | 173 tests, tabs |
| 1.4.4 | Dealer onboarding wizard | Manual | 2026-01-01 | 204 tests, 4-step wizard |
| 1.4.5 | Dealer hierarchy visualization | Manual | 2026-01-01 | 215 tests, tree view |
| 1.5.1 | Audit log service | Manual | 2026-01-01 | 235 tests |
| 1.5.2 | Audit log viewer | Manual | 2026-01-01 | 266 tests |
| 2.1.1 | Product list view | Manual | 2026-01-01 | 299 tests |
| 2.1.2 | Product search | Manual | 2026-01-01 | 322 tests |
| 2.1.3 | Product filters | Manual | 2026-01-01 | Filter chips, URL sync |
| 2.1.4 | Product detail page | Manual | 2026-01-01 | 344 tests |
| 2.1.5 | Category navigation | Manual | 2026-01-01 | 359 tests |
| 2.2.1 | Product CRUD (Admin) | Manual | 2026-01-01 | 390 tests |
| 2.2.2 | Category Management | Manual | 2026-01-01 | 413 tests |
| 2.3.1 | Inventory Dashboard | Manual | 2026-01-01 | 439 tests |
| 2.3.2 | Inventory List | Manual | 2026-01-01 | 464 tests |
| 2.3.3 | Location Management | Manual | 2026-01-01 | 487 tests |
| 2.3.4 | Inventory Adjustments | Manual | 2026-01-01 | 506 tests |
| 2.3.5 | Low Stock Alerts | Manual | 2026-01-01 | 533 tests |
| 3.1.1 | Cart State Management | Manual | 2026-01-01 | 578 tests |
| 3.1.2 | Cart UI Components | Manual | 2026-01-01 | CartIcon, CartDrawer, etc. |
| 3.2.1 | Checkout Page | Manual | 2026-01-01 | 615 tests |
| 3.3.1 | Order Service | Manual | 2026-01-01 | 664 tests |
| 3.5.1 | Invoice Generation | Manual | 2026-01-01 | 697 tests |
| 3.6.1 | Admin Order List | Manual | 2026-01-01 | 741 tests |
| 4.1.1 | Dealer Dashboard Layout | Manual | 2026-01-01 | 781 tests |
| 4.2.1 | Sales Summary Report | Manual | 2026-01-01 | 825 tests |
| 4.3.1 | Inventory Value Report | Manual | 2026-01-01 | 867 tests |
| 4.4.1 | Admin Analytics Dashboard | Manual | 2026-01-01 | 901 tests |
| 4.5.1 | Report Export | Manual | 2026-01-01 | 950 tests |
| 4.6.1 | Forecasting schema design | Manual | 2026-01-01 | 5 new models (19 total) |
| 4.6.2 | Demand analysis algorithms | Manual | 2026-01-01 | Trend, seasonality, confidence |
| 4.6.3 | Forecasting service | Manual | 2026-01-01 | 18-month planning |
| 4.6.4 | Forecasting API routes | Manual | 2026-01-01 | 4 endpoints |
| 4.6.5 | Forecasting dashboard UI | Manual | 2026-01-01 | Summary, charts, timeline |
| 5.1.1 | Document Library | Manual | 2026-01-01 | 1058 tests |
| 5.1.2 | File Upload | Manual | 2026-01-01 | 1101 tests |
| 5.1.3 | Document Preview | Manual | 2026-01-01 | 1161 tests |
| 5.2.1 | Notification Service | Manual | 2026-01-01 | 1002 tests |
| 5.2.2 | In-App Notifications | Manual | 2026-01-01 | Bell icon, dropdown, filters |
| 8.2.1 | Incentives schema | Manual | 2026-01-06 | 6 models + comprehensive service |
| 8.2.2 | Program admin CRUD | Manual | 2026-01-06 | Admin pages, forms, detail view |
| 8.2.3 | Dealer enrollment flow | Manual | 2026-01-06 | /incentives page, enrollment modal, program detail |
| 8.2.4 | Rebate calculation engine | Manual | 2026-01-06 | Batch accrual processing, projected rebates, admin accruals tab |

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
| Phase 4 | 42 | 402 | 101 |
| Phase 5 | 14 | 160 | 40 |
| Phase 6 | 13 | 165 | 41 |
| Phase 7 | 10 | 130 | 33 |
| Phase 8 | 48 | 600 | 150 |
| **Total** | **193** | **2247** | **563** |

*Assuming ~4 iterations per hour with Ralph Wiggum
*Phase 4.6 Inventory Forecasting: 8 completed, 20 pending (includes 17 enhancement tasks)
*Phase 8: Relationship Layer - 48 new tasks for dealer/OEM connective tissue

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

*Document Version: 2.2*
*Last Updated: 2026-01-01*
*Enhancement Plan: See .ralph/FORECASTING_ENHANCEMENT_PLAN.md for detailed phase descriptions*
