# THORDealerPortal - Deep Project Plan

## Executive Summary

THORDealerPortal is a comprehensive B2B platform enabling dealers to manage inventory, process orders, access analytics, and communicate with the organization. This document outlines the complete technical architecture, development phases, and implementation strategy.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Modules](#core-modules)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Security Architecture](#security-architecture)
8. [Development Phases](#development-phases)
9. [Infrastructure](#infrastructure)
10. [Quality Assurance](#quality-assurance)

---

## Vision & Goals

### Primary Objectives

1. **Streamline Dealer Operations** - Single platform for all dealer activities
2. **Real-time Inventory Visibility** - Live sync with central inventory systems
3. **Self-Service Capabilities** - Reduce support burden through automation
4. **Data-Driven Decisions** - Comprehensive analytics and reporting
5. **Scalable Architecture** - Support growth from 100 to 10,000+ dealers

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dealer Adoption Rate | 95% within 6 months | Active users / Total dealers |
| Order Processing Time | < 2 minutes | Time from order start to confirmation |
| System Uptime | 99.9% | Monthly availability |
| Page Load Time | < 2 seconds | P95 latency |
| Support Ticket Reduction | 40% | Compared to pre-portal baseline |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│   Web Browser    │    Mobile Browser    │    Future Mobile App          │
└────────┬─────────┴──────────┬───────────┴─────────────┬─────────────────┘
         │                    │                         │
         ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CDN (CloudFront)                               │
│                    Static Assets / Edge Caching                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER (ALB)                               │
│                     SSL Termination / Routing                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Server 1  │    │   App Server 2  │    │   App Server N  │
│   (Next.js)     │    │   (Next.js)     │    │   (Next.js)     │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │       S3        │
│   (Primary DB)  │    │  (Cache/Queue)  │    │  (File Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interaction Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Routes  │────▶│   Services   │
│   (React)    │     │  (Next.js)   │     │   (Logic)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     ▼                            ▼                            ▼
              ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
              │ Repository  │             │   Cache     │             │  External   │
              │  (Prisma)   │             │  (Redis)    │             │    APIs     │
              └─────────────┘             └─────────────┘             └─────────────┘
```

---

## Technology Stack

### Frontend

| Category | Technology | Rationale |
|----------|------------|-----------|
| Framework | Next.js 14+ | SSR, API routes, app router |
| Language | TypeScript | Type safety, better DX |
| UI Library | React 18+ | Component architecture |
| Styling | Tailwind CSS | Rapid development, consistency |
| Components | shadcn/ui | Accessible, customizable |
| State | Zustand | Lightweight, simple |
| Forms | React Hook Form + Zod | Validation, performance |
| Data Fetching | TanStack Query | Caching, mutations |
| Charts | Recharts | React-native, composable |

### Backend

| Category | Technology | Rationale |
|----------|------------|-----------|
| Runtime | Node.js 20+ | LTS, performance |
| Framework | Next.js API Routes | Unified codebase |
| ORM | Prisma | Type-safe, migrations |
| Validation | Zod | Schema validation |
| Auth | NextAuth.js | Flexible, secure |
| Email | Resend / SendGrid | Transactional emails |
| Jobs | BullMQ | Redis-backed queues |
| WebSockets | Socket.io | Real-time updates |

### Database & Storage

| Category | Technology | Rationale |
|----------|------------|-----------|
| Primary DB | PostgreSQL 15+ | Robust, JSON support |
| Cache | Redis 7+ | Speed, pub/sub |
| Search | PostgreSQL FTS / Meilisearch | Full-text search |
| Files | AWS S3 | Scalable, reliable |
| CDN | CloudFront | Global distribution |

### Infrastructure

| Category | Technology | Rationale |
|----------|------------|-----------|
| Cloud | AWS | Industry standard |
| Containers | Docker | Consistency |
| Orchestration | ECS / Kubernetes | Scalability |
| CI/CD | GitHub Actions | Integration |
| Monitoring | Datadog / New Relic | Observability |
| Logging | CloudWatch + Axiom | Centralized logs |

---

## Core Modules

### Module Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THORDealerPortal Modules                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRANSACTION LAYER (Built)                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Authentication  │  │     Dealer      │  │    Inventory    │          │
│  │ & Authorization │  │   Management    │  │   Management    │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │     Order       │  │   Reporting &   │  │    Document     │          │
│  │   Management    │  │    Analytics    │  │   Management    │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Notification   │  │     Admin       │  │   Integration   │          │
│  │     System      │  │     Panel       │  │      Hub        │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  RELATIONSHIP LAYER (Planned - Phase 8)                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Communication  │  │   Incentives    │  │    Training &   │          │
│  │      Hub        │  │   & Programs    │  │  Certification  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Performance   │  │    Parts &      │  │   Marketing     │          │
│  │   Scorecard     │  │    Service      │  │  Asset Library  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dealer/OEM Relationship Strategy

### The "Connective Tissue" Vision

The THORDealerPortal aims to capture **all elements of dealer/OEM connectivity** in a single, intuitive platform. While the Transaction Layer handles day-to-day operations, the **Relationship Layer** strengthens the partnership between THOR and its dealer network.

### What's Built vs. What's Missing

```
TRANSACTION LAYER (Complete)          RELATIONSHIP LAYER (Planned)
├── Dealer Management     ✅          ├── Communication Hub      ⏳
├── Product Catalog       ✅          ├── Incentives & Programs  ⏳
├── Order Processing      ✅          ├── Training Portal        ⏳
├── Inventory Management  ✅          ├── Performance Scorecard  ⏳
├── Warranty Claims       ✅          ├── Parts & Service        ⏳
├── Invoicing             ✅          └── Marketing Assets       ⏳
├── Forecasting           ✅
└── Document Library      ✅
```

### Strategic Priority Matrix

| Module | Business Impact | Dealer Value | Implementation Effort | Priority |
|--------|-----------------|--------------|----------------------|----------|
| Communication Hub | High | High | Medium | **P1** |
| Incentives & Programs | Very High | Very High | High | **P1** |
| Training Portal | High | High | Medium | **P1** |
| Performance Scorecard | High | Medium | Medium | **P1** |
| Parts & Service | Medium | High | High | P2 |
| Marketing Assets | Medium | High | Low | P2 |
| Floor Plan Dashboard | Medium | Medium | Medium | P3 |
| Territory Management | Low | Medium | Medium | P3 |

### Module Details

#### 1. Authentication & Authorization

**Purpose**: Secure access control with role-based permissions

**Features**:
- Email/password authentication
- Multi-factor authentication (MFA)
- SSO integration (SAML/OIDC)
- Role-based access control (RBAC)
- Session management
- Password reset flow
- Account lockout protection

**Roles**:
| Role | Description | Permissions |
|------|-------------|-------------|
| Super Admin | System-wide access | Full access |
| Admin | Organization management | Manage dealers, users, settings |
| Dealer Admin | Dealer-level admin | Manage dealer users, all dealer data |
| Dealer User | Standard dealer user | View/edit assigned data |
| Readonly | View-only access | Read-only access |

#### 2. Dealer Management

**Purpose**: Complete dealer lifecycle management

**Features**:
- Dealer registration & onboarding
- Profile management (contact, address, business info)
- Territory assignment
- Contract management
- Performance tiers
- Status tracking (active, suspended, pending)
- Dealer hierarchy (parent/child relationships)

**Data Model**:
```
Dealer
├── id, code, name, status
├── businessInfo (EIN, licenses, insurance)
├── contactInfo (primary, billing, shipping)
├── territory (regions, zip codes)
├── tier (platinum, gold, silver, bronze)
├── contracts[]
├── users[]
└── settings (preferences, notifications)
```

#### 3. Inventory Management

**Purpose**: Real-time inventory visibility and management

**Features**:
- Product catalog browsing
- Stock level visibility
- Inventory reservations
- Low stock alerts
- Inventory transfers
- Location management
- Product search & filtering
- Image galleries
- Specification sheets

**Sync Strategy**:
```
External ERP ──▶ Sync Service ──▶ PostgreSQL ──▶ Redis Cache ──▶ Frontend
     │                │
     │                ▼
     │         Conflict Resolution
     │                │
     │                ▼
     └──────── Delta Updates
```

#### 4. Order Management

**Purpose**: End-to-end order processing

**Features**:
- Shopping cart functionality
- Quote generation
- Order placement
- Order tracking
- Order history
- Invoice management
- Payment integration
- Returns & exchanges
- Backorder management

**Order States**:
```
Draft ──▶ Submitted ──▶ Confirmed ──▶ Processing ──▶ Shipped ──▶ Delivered
                            │
                            ├──▶ Partially Shipped
                            │
                            └──▶ Cancelled
```

#### 5. Reporting & Analytics

**Purpose**: Data-driven insights for dealers and admins

**Features**:
- Sales dashboards
- Inventory turnover reports
- Performance comparisons
- Custom report builder
- Scheduled reports (email delivery)
- Export functionality (PDF, Excel, CSV)
- Real-time metrics
- Historical trending

**Key Reports**:
| Report | Audience | Frequency |
|--------|----------|-----------|
| Sales Summary | Dealers | Daily/Weekly |
| Inventory Aging | Dealers | Weekly |
| Performance Scorecard | Dealers | Monthly |
| Network Overview | Admins | Real-time |
| Dealer Comparison | Admins | Monthly |

#### 6. Document Management

**Purpose**: Centralized document repository

**Features**:
- Document upload/download
- Version control
- Access permissions
- Document categories
- Full-text search
- Preview functionality
- Expiration tracking
- Audit trail

**Document Types**:
- Contracts & agreements
- Marketing materials
- Product specifications
- Training materials
- Compliance documents
- Insurance certificates

#### 7. Notification System

**Purpose**: Multi-channel communication

**Channels**:
- In-app notifications
- Email notifications
- SMS notifications (optional)
- Push notifications (future mobile)

**Notification Types**:
| Type | Priority | Channels |
|------|----------|----------|
| Order Updates | High | In-app, Email |
| Low Stock Alerts | Medium | In-app, Email |
| Document Expiration | Medium | Email |
| System Announcements | Low | In-app |
| Marketing | Low | Email (opt-in) |

#### 8. Admin Panel

**Purpose**: System administration and monitoring

**Features**:
- User management
- Dealer management
- System configuration
- Audit logs
- Feature flags
- Bulk operations
- Data imports/exports
- System health monitoring

#### 9. Integration Hub

**Purpose**: External system connectivity

**Integrations**:
| System | Type | Purpose |
|--------|------|---------|
| ERP (SAP/Oracle) | Bidirectional | Orders, Inventory |
| CRM (Salesforce) | Bidirectional | Dealer data |
| Payment Gateway | Outbound | Payments |
| Shipping Carriers | Outbound | Tracking |
| Email Service | Outbound | Notifications |
| Analytics | Outbound | Metrics |

---

### Relationship Layer Modules (Phase 8)

These modules represent the "connective tissue" that transforms the portal from a transaction system into a true dealer-OEM relationship platform.

#### 10. Communication Hub

**Purpose**: Centralized dealer-OEM communication channel

**Features**:
- Support ticket system (dealer → OEM requests)
- OEM announcements/bulletins (broadcast to dealers)
- Product alerts (recalls, updates, discontinuations)
- Direct messaging (assigned rep ↔ dealer)
- Knowledge base (FAQs, self-service articles)
- Ticket categorization and routing
- SLA tracking and escalation

**Data Model**:
```
SupportTicket
├── id, ticketNumber, dealerId
├── category (product, warranty, order, billing, other)
├── priority (low, normal, high, urgent)
├── status (open, in_progress, pending_dealer, resolved, closed)
├── subject, description
├── assignedTo (OEM rep user)
├── messages[], attachments[]
└── SLA tracking (responseTime, resolutionTime)

Announcement
├── id, title, content
├── type (news, alert, recall, promotion)
├── priority (normal, important, critical)
├── targetTiers[] (which dealer tiers see this)
├── publishAt, expiresAt
└── readReceipts[]
```

#### 11. Incentives & Programs Module

**Purpose**: Manage the financial relationship that drives dealer loyalty

**Features**:
- Volume rebate program management
- Co-op marketing fund tracking (accrual/claim)
- Sales contests and spiffs
- Dealer tier benefits display
- Rebate dashboard (earned, pending, paid)
- Program enrollment and compliance
- Payout history and forecasting

**Data Model**:
```
IncentiveProgram
├── id, name, type (rebate, coop, contest, spiff)
├── startDate, endDate, status
├── rules (JSON - tiers, thresholds, rates)
├── eligibleTiers[]
└── enrollments[]

DealerProgramEnrollment
├── dealerId, programId
├── enrolledAt, status
├── accruedAmount, paidAmount
└── claims[]

IncentiveClaim
├── id, dealerId, programId
├── amount, status (pending, approved, denied, paid)
├── supportingDocs[]
└── payoutDate
```

**Key Reports**:
| Report | Purpose |
|--------|---------|
| Rebate Accrual Summary | What dealers have earned |
| Co-op Fund Balance | Available marketing funds |
| Program ROI Analysis | Effectiveness of incentives |
| Tier Progression Tracker | Dealers close to next tier |

#### 12. Training & Certification Portal

**Purpose**: Ensure dealers are properly trained to sell and service products

**Features**:
- Course catalog (product, sales, service training)
- Certification tracking (required vs optional)
- Expiration alerts and re-certification reminders
- Video/PDF content delivery
- Quiz and assessment system
- Compliance reports (who's certified, who's not)
- Dealer staff management (assign training to staff)
- Training history and transcripts

**Data Model**:
```
TrainingCourse
├── id, title, description
├── category (product, sales, service, compliance)
├── type (video, document, quiz, webinar)
├── duration, requiredFor[] (dealer tiers/roles)
├── content (URL, embedded, SCORM)
└── expirationMonths (cert validity)

Certification
├── id, userId, courseId
├── status (in_progress, completed, expired)
├── completedAt, expiresAt
├── score (if quiz-based)
└── certificate (PDF URL)

TrainingAssignment
├── dealerId, userId, courseId
├── assignedBy, dueDate
└── status
```

**Compliance Dashboard**:
- Certification coverage by dealer
- Expiring certifications (30/60/90 day view)
- Training completion trends
- Dealer compliance score

#### 13. Dealer Performance Scorecard

**Purpose**: Data-driven dealer evaluation and tier management

**Features**:
- Sales performance vs. quota and prior year
- Customer satisfaction (CSI) scores
- Warranty claim rates (quality indicator)
- Training compliance percentage
- Inventory turn metrics
- Payment history (days to pay)
- Composite score calculation
- 12-month trend visualization
- Automatic tier promotion/demotion recommendations

**Data Model**:
```
DealerScorecard
├── dealerId, periodStart, periodEnd
├── salesScore, salesTarget, salesActual
├── csiScore, warrantyClaimRate
├── trainingComplianceRate
├── inventoryTurnRate
├── avgDaysToPay
├── compositeScore (0-100)
└── tierRecommendation

PerformanceMetric
├── dealerId, metricType
├── period, value
├── trend (up, down, stable)
└── benchmark (industry/network average)
```

**Scorecard Components**:
| Metric | Weight | Source |
|--------|--------|--------|
| Sales vs Target | 30% | Orders |
| YoY Growth | 15% | Orders |
| CSI Score | 20% | External/Survey |
| Warranty Rate | 10% | Warranty Claims |
| Training Compliance | 10% | Training Module |
| Inventory Turn | 10% | Inventory |
| Payment Terms | 5% | Invoices |

#### 14. Parts & Service Module (Future)

**Purpose**: Post-sale support and parts ordering

**Features**:
- Parts catalog (separate from unit ordering)
- Quick order / repeat order templates
- Service bulletins (TSBs)
- Technical support requests
- Recall management
- Parts return authorization (RMA)
- Service history tracking

#### 15. Marketing Asset Library (Future)

**Purpose**: Help dealers sell more effectively

**Features**:
- Co-branded materials (flyers, signage)
- Digital assets (logos, photos, videos)
- Customization tools (add dealer info)
- Campaign templates (email, social)
- Asset usage analytics
- Market intelligence / competitive data

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│   Dealer    │───────│  Territory  │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │
      │                     │
      ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Session   │       │    Order    │───────│  OrderItem  │
└─────────────┘       └─────────────┘       └─────────────┘
                            │                      │
                            │                      │
                            ▼                      ▼
                      ┌─────────────┐       ┌─────────────┐
                      │   Invoice   │       │   Product   │
                      └─────────────┘       └─────────────┘
                                                   │
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Inventory  │
                                            └─────────────┘
```

### Core Tables

```sql
-- Users & Authentication
users (id, email, password_hash, role, dealer_id, status, mfa_enabled, ...)
sessions (id, user_id, token, expires_at, ip_address, user_agent, ...)
password_resets (id, user_id, token, expires_at, used_at, ...)

-- Dealers
dealers (id, code, name, status, tier, parent_dealer_id, ...)
dealer_contacts (id, dealer_id, type, name, email, phone, ...)
dealer_addresses (id, dealer_id, type, street, city, state, zip, ...)
dealer_contracts (id, dealer_id, type, start_date, end_date, document_url, ...)

-- Products & Inventory
products (id, sku, name, description, category_id, price, status, ...)
product_categories (id, name, parent_id, ...)
product_images (id, product_id, url, position, ...)
inventory (id, product_id, location_id, quantity, reserved, ...)
inventory_locations (id, name, type, address, ...)

-- Orders
orders (id, dealer_id, status, subtotal, tax, total, placed_at, ...)
order_items (id, order_id, product_id, quantity, price, ...)
order_status_history (id, order_id, status, changed_by, changed_at, ...)

-- Documents
documents (id, dealer_id, category, name, url, version, expires_at, ...)
document_access_log (id, document_id, user_id, action, accessed_at, ...)

-- Notifications
notifications (id, user_id, type, title, body, read_at, ...)
notification_preferences (id, user_id, type, email, sms, in_app, ...)

-- Audit
audit_logs (id, user_id, action, entity_type, entity_id, changes, created_at, ...)
```

### Indexing Strategy

```sql
-- Primary access patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_dealer_id ON users(dealer_id);
CREATE INDEX idx_orders_dealer_id_status ON orders(dealer_id, status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);
CREATE INDEX idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Full-text search
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || description));
```

---

## API Design

### RESTful Endpoints

#### Authentication
```
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password
POST   /api/auth/mfa/setup          # Setup MFA
POST   /api/auth/mfa/verify         # Verify MFA code
```

#### Users
```
GET    /api/users                   # List users (admin)
POST   /api/users                   # Create user
GET    /api/users/:id               # Get user
PATCH  /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user
GET    /api/users/me                # Current user profile
PATCH  /api/users/me                # Update profile
```

#### Dealers
```
GET    /api/dealers                 # List dealers
POST   /api/dealers                 # Create dealer
GET    /api/dealers/:id             # Get dealer
PATCH  /api/dealers/:id             # Update dealer
DELETE /api/dealers/:id             # Delete dealer
GET    /api/dealers/:id/users       # Dealer users
GET    /api/dealers/:id/orders      # Dealer orders
GET    /api/dealers/:id/documents   # Dealer documents
POST   /api/dealers/:id/invite      # Invite user to dealer
```

#### Products
```
GET    /api/products                # List products
GET    /api/products/:id            # Get product
GET    /api/products/:id/inventory  # Product inventory
GET    /api/products/search         # Search products
GET    /api/categories              # List categories
GET    /api/categories/:id/products # Category products
```

#### Inventory
```
GET    /api/inventory               # List inventory
GET    /api/inventory/:id           # Get inventory item
POST   /api/inventory/reserve       # Reserve inventory
DELETE /api/inventory/reserve/:id   # Release reservation
GET    /api/inventory/locations     # List locations
```

#### Orders
```
GET    /api/orders                  # List orders
POST   /api/orders                  # Create order
GET    /api/orders/:id              # Get order
PATCH  /api/orders/:id              # Update order
DELETE /api/orders/:id              # Cancel order
POST   /api/orders/:id/submit       # Submit order
GET    /api/orders/:id/tracking     # Order tracking
GET    /api/orders/:id/invoice      # Order invoice
```

#### Cart
```
GET    /api/cart                    # Get cart
POST   /api/cart/items              # Add to cart
PATCH  /api/cart/items/:id          # Update cart item
DELETE /api/cart/items/:id          # Remove from cart
DELETE /api/cart                    # Clear cart
POST   /api/cart/checkout           # Convert to order
```

#### Documents
```
GET    /api/documents               # List documents
POST   /api/documents               # Upload document
GET    /api/documents/:id           # Get document
DELETE /api/documents/:id           # Delete document
GET    /api/documents/:id/download  # Download document
```

#### Reports
```
GET    /api/reports/sales           # Sales report
GET    /api/reports/inventory       # Inventory report
GET    /api/reports/performance     # Performance report
POST   /api/reports/custom          # Generate custom report
GET    /api/reports/exports/:id     # Download export
```

#### Notifications
```
GET    /api/notifications           # List notifications
PATCH  /api/notifications/:id/read  # Mark as read
POST   /api/notifications/read-all  # Mark all as read
GET    /api/notifications/preferences  # Get preferences
PATCH  /api/notifications/preferences  # Update preferences
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Security Architecture

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   Auth   │────▶│   User   │────▶│ Session  │
│          │     │ Service  │     │   Store  │     │  Store   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                                  │
     │                ▼                                  │
     │         ┌──────────┐                             │
     │         │   MFA    │                             │
     │         │ Service  │                             │
     │         └──────────┘                             │
     │                                                   │
     ◀───────────────────────────────────────────────────
           JWT Token (access + refresh)
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | TLS 1.3 | HTTPS only, HSTS |
| Authentication | JWT + Refresh | Short-lived access tokens |
| Authorization | RBAC | Role-based permissions |
| Input | Validation | Zod schemas |
| Output | Sanitization | XSS prevention |
| Database | Parameterized | Prisma ORM |
| Secrets | Encryption | AWS Secrets Manager |
| Sessions | Secure cookies | HttpOnly, SameSite |
| Rate Limiting | Per-endpoint | Redis-based |
| Audit | Comprehensive logging | All mutations logged |

### Data Protection

```
┌─────────────────────────────────────────────────────────┐
│                    Data Classification                   │
├─────────────────────────────────────────────────────────┤
│  PUBLIC       │ Product catalogs, marketing materials   │
├───────────────┼─────────────────────────────────────────┤
│  INTERNAL     │ Pricing, inventory levels               │
├───────────────┼─────────────────────────────────────────┤
│  CONFIDENTIAL │ Orders, dealer info, contracts          │
├───────────────┼─────────────────────────────────────────┤
│  RESTRICTED   │ Passwords, payment data, PII            │
└───────────────┴─────────────────────────────────────────┘
```

---

## Development Phases

### Phase 0: Foundation (Weeks 1-2)

**Goal**: Project infrastructure and base setup

**Deliverables**:
- [ ] Repository structure
- [ ] Development environment (Docker)
- [ ] CI/CD pipeline
- [ ] Code quality tools (ESLint, Prettier, Husky)
- [ ] Testing framework (Jest, Playwright)
- [ ] Database setup and migrations
- [ ] Base Next.js configuration
- [ ] Tailwind + shadcn/ui setup
- [ ] Environment configuration

### Phase 1: Authentication & Core (Weeks 3-5)

**Goal**: Secure foundation with basic dealer management

**Deliverables**:
- [ ] User authentication (login, logout, password reset)
- [ ] Session management
- [ ] Role-based access control
- [ ] User profile management
- [ ] Dealer CRUD operations
- [ ] Dealer onboarding flow
- [ ] Basic admin panel
- [ ] Audit logging

### Phase 2: Inventory & Products (Weeks 6-8)

**Goal**: Product catalog and inventory visibility

**Deliverables**:
- [ ] Product catalog UI
- [ ] Product search and filtering
- [ ] Category navigation
- [ ] Inventory display
- [ ] Low stock alerts
- [ ] Product detail pages
- [ ] Image galleries
- [ ] Specification sheets

### Phase 3: Order Management (Weeks 9-12)

**Goal**: Complete order processing workflow

**Deliverables**:
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Order placement
- [ ] Order confirmation
- [ ] Order history
- [ ] Order tracking
- [ ] Invoice generation
- [ ] Order status updates

### Phase 4: Reporting & Analytics (Weeks 13-15)

**Goal**: Data insights for dealers and admins

**Deliverables**:
- [ ] Dealer dashboard
- [ ] Sales reports
- [ ] Inventory reports
- [ ] Performance metrics
- [ ] Export functionality
- [ ] Scheduled reports
- [ ] Admin analytics dashboard

### Phase 5: Documents & Notifications (Weeks 16-18)

**Goal**: Document management and communication

**Deliverables**:
- [ ] Document upload/download
- [ ] Document organization
- [ ] Version control
- [ ] In-app notifications
- [ ] Email notifications
- [ ] Notification preferences
- [ ] System announcements

### Phase 6: Integrations & Polish (Weeks 19-22)

**Goal**: External integrations and refinement

**Deliverables**:
- [ ] ERP integration
- [ ] Payment gateway
- [ ] Email service integration
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation

### Phase 7: Launch Preparation (Weeks 23-24)

**Goal**: Production readiness

**Deliverables**:
- [ ] Production infrastructure
- [ ] Monitoring and alerting
- [ ] Backup and recovery
- [ ] Load testing
- [ ] Security penetration testing
- [ ] User training materials
- [ ] Support documentation
- [ ] Go-live plan

### Phase 8: Relationship Layer (Post-Launch)

**Goal**: Dealer/OEM "Connective Tissue" - Transform from transaction portal to relationship platform

**8.1 Communication Hub** (Priority 1)
- [ ] Database schema (SupportTicket, TicketMessage, Announcement, KnowledgeArticle)
- [ ] Support ticket submission and tracking
- [ ] Ticket assignment and routing
- [ ] OEM rep ticket management
- [ ] Announcement creation and publishing
- [ ] Dealer announcement feed
- [ ] Knowledge base articles
- [ ] SLA tracking and escalation alerts

**8.2 Incentives & Programs** (Priority 1)
- [ ] Database schema (IncentiveProgram, Enrollment, Claim, Payout)
- [ ] Program management admin UI
- [ ] Dealer program enrollment
- [ ] Rebate accrual calculation engine
- [ ] Co-op fund tracking
- [ ] Claim submission and approval workflow
- [ ] Dealer incentives dashboard
- [ ] Payout history and forecasting

**8.3 Training & Certification Portal** (Priority 1)
- [ ] Database schema (Course, Certification, Assignment, Quiz)
- [ ] Course catalog and content management
- [ ] Video/document content delivery
- [ ] Quiz/assessment engine
- [ ] Certification tracking
- [ ] Expiration alerts
- [ ] Training assignment workflow
- [ ] Compliance dashboard

**8.4 Dealer Performance Scorecard** (Priority 1)
- [ ] Database schema (Scorecard, Metric, Target)
- [ ] Metric calculation engine
- [ ] Scorecard dashboard (dealer view)
- [ ] Network performance view (admin)
- [ ] Trend visualization
- [ ] Tier recommendation engine
- [ ] Benchmark comparisons

**8.5 Parts & Service Module** (Priority 2)
- [ ] Parts catalog (separate from RV units)
- [ ] Quick order / templates
- [ ] Service bulletin management
- [ ] Technical support ticketing
- [ ] Recall tracking
- [ ] Parts RMA workflow

**8.6 Marketing Asset Library** (Priority 2)
- [ ] Asset upload and management
- [ ] Co-branding tools
- [ ] Asset search and filtering
- [ ] Usage analytics
- [ ] Campaign template library

---

## Infrastructure

### Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Local Docker │ Feature branch deployments │ Local PostgreSQL/Redis     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            STAGING                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ECS Fargate │ RDS PostgreSQL │ ElastiCache Redis │ S3 │ CloudFront    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ECS Fargate (Multi-AZ) │ RDS Multi-AZ │ ElastiCache Cluster │ S3 │ CF │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| ECS Fargate | Application hosting | Auto-scaling |
| RDS PostgreSQL | Primary database | Multi-AZ, automated backups |
| ElastiCache | Redis caching | Cluster mode |
| S3 | File storage | Versioning, lifecycle |
| CloudFront | CDN | Edge caching |
| ALB | Load balancing | SSL termination |
| Route 53 | DNS | Health checks |
| ACM | SSL certificates | Auto-renewal |
| Secrets Manager | Secrets | Rotation |
| CloudWatch | Monitoring | Logs, metrics, alarms |
| WAF | Web firewall | Rate limiting, rules |

---

## Quality Assurance

### Testing Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Testing Pyramid                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           ┌─────────┐                                   │
│                          │   E2E   │  < 10%                            │
│                         └─────────┘                                     │
│                        ┌───────────────┐                                │
│                       │  Integration  │  ~ 20%                         │
│                      └───────────────┘                                  │
│                     ┌───────────────────────┐                           │
│                    │        Unit           │  > 70%                    │
│                   └───────────────────────┘                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Test Types

| Type | Tool | Scope | Run Frequency |
|------|------|-------|---------------|
| Unit | Jest | Functions, hooks | Every commit |
| Component | Testing Library | React components | Every commit |
| Integration | Jest + Supertest | API routes | Every PR |
| E2E | Playwright | User flows | Daily / Pre-deploy |
| Visual | Playwright | Screenshots | Weekly |
| Performance | k6 | Load testing | Pre-release |
| Security | OWASP ZAP | Vulnerability scan | Weekly |

### Code Quality Gates

| Gate | Threshold | Tool |
|------|-----------|------|
| Test Coverage | > 80% | Jest |
| Type Coverage | 100% | TypeScript |
| Lint Errors | 0 | ESLint |
| Format Issues | 0 | Prettier |
| Complexity | < 10 | ESLint |
| Bundle Size | < 200KB initial | Next.js |
| Lighthouse | > 90 | Lighthouse CI |

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Dealer | Business partner that sells products |
| Territory | Geographic region assigned to dealer |
| SKU | Stock Keeping Unit - product identifier |
| Tier | Dealer classification (platinum, gold, silver, bronze) |
| PO | Purchase Order |
| MFA | Multi-Factor Authentication |
| RBAC | Role-Based Access Control |

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)

---

*Document Version: 1.0*
*Last Updated: January 2026*
