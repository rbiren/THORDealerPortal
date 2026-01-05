# THORDealerPortal

A comprehensive B2B dealer portal platform capturing **all elements of dealer/OEM connective tissue** in a simple, digestible, intuitive platform.

## Vision

Transform from a transaction portal into a true **dealer-OEM relationship platform** by combining:
- **Transaction Layer** - Day-to-day operations (ordering, inventory, warranty)
- **Relationship Layer** - Partnership building (communication, incentives, training, performance)

## Status

🚧 **In Development** - Transaction layer complete, Relationship layer in planning

## Tech Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (SQLite for local dev), Redis
- **Infrastructure**: AWS (ECS, RDS, S3, CloudFront)

## Quick Start

```bash
# Clone
git clone <repository-url>
cd THORDealerPortal

# Install
npm install

# Setup database
npm run db:setup

# Run development server
npm run dev
```

## Font Loading

Add the following to your HTML `<head>` for Thor Industries brand fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

## Documentation

| Document | Purpose |
|----------|---------|
| [Style Guide](docs/STYLE_GUIDE.md) | Thor Industries brand guidelines, design tokens, components |
| [Project Plan](docs/PROJECT_PLAN.md) | Architecture, phases, technical specs |
| [Task Backlog](.ralph/TASK_BACKLOG.md) | Development tasks with Ralph commands |
| [CLAUDE.md](CLAUDE.md) | AI assistant guidelines |

## Project Structure

```
THORDealerPortal/
├── src/                # Application source
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   ├── lib/            # Utilities and helpers
│   └── types/          # TypeScript types
├── styles/             # Design system styles
│   ├── main.css        # Main entry point
│   ├── design-tokens.css
│   └── components/     # Component styles
├── prisma/             # Database schema
├── tests/              # Test suites
├── docs/               # Documentation
└── .ralph/             # Development task tracking
```

## Core Features

### Transaction Layer (Complete)

| Module | Description | Status |
|--------|-------------|--------|
| **Authentication** | Login, sessions, role-based access | ✅ |
| **Dashboard** | Overview metrics, recent activity, quick actions | ✅ |
| **Dealer Management** | Registration, onboarding, hierarchy, profiles | ✅ |
| **Inventory** | Real-time stock, adjustments, locations, forecasting | ✅ |
| **Orders** | Cart, checkout, tracking, order management | ✅ |
| **Invoices** | Invoice generation, status tracking, payment info | ✅ |
| **Warranty Claims** | Claim submission, review workflow, approvals | ✅ |
| **Reporting** | Dashboards, analytics, exports | ✅ |
| **Documents** | Upload, preview, library | ✅ |
| **Notifications** | In-app notifications, bell icon | ✅ |

### Relationship Layer (Planned - Phase 8)

| Module | Description | Priority | Status |
|--------|-------------|----------|--------|
| **Communication Hub** | Support tickets, OEM announcements, knowledge base | P1 | ⏳ |
| **Incentives & Programs** | Volume rebates, co-op funds, sales contests | P1 | ⏳ |
| **Training Portal** | Course catalog, certifications, compliance | P1 | ⏳ |
| **Performance Scorecard** | KPIs, tier management, benchmarks | P1 | ⏳ |
| **Parts & Service** | Parts catalog, service bulletins, recalls | P2 | ⏳ |
| **Marketing Assets** | Co-branded materials, digital assets | P2 | ⏳ |

### Why the Relationship Layer Matters

```
TRANSACTION LAYER              RELATIONSHIP LAYER
"What dealers DO"      +       "Why dealers STAY"
─────────────────────────────────────────────────
Order products                 Get rebates & incentives
Submit warranty claims         Talk to OEM support
Check inventory                Complete training
Pay invoices                   See performance score
```

The Relationship Layer transforms dealers from **customers** into **partners**.

## Recommended Build Sequence

**Start with Communication Hub** - it provides immediate value and is foundational:

```
Phase 8.1: Communication Hub
├── Support ticket system (dealer → OEM)
├── OEM announcements (OEM → dealers)
└── Knowledge base (self-service)

Phase 8.2: Incentives & Programs
├── Rebate program management
├── Co-op fund tracking
└── Dealer tier benefits

Phase 8.3: Training Portal
├── Course catalog
├── Certification tracking
└── Compliance dashboard

Phase 8.4: Performance Scorecard
├── KPI dashboard
├── Trend visualization
└── Tier management
```

See `.ralph/TASK_BACKLOG.md` for detailed tasks with Ralph Wiggum commands.

## Style Guide

This project follows the Thor Industries brand guidelines.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#181817` | Primary text, headers, dark backgrounds |
| Off-White | `#FFFDFA` | Light backgrounds, inverse text |
| Dark Gray | `#2A2928` | Buttons, secondary elements |
| Olive Green | `#495737` | Success states, accents |
| Burnt Orange | `#A46807` | Warnings, focus states, CTAs |

### Typography

- **Headings**: Montserrat (600-800 weight, uppercase)
- **Body**: Open Sans (400-600 weight)

### Using Design Tokens

```css
.my-component {
  color: var(--color-charcoal);
  background-color: var(--color-bg-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

## License

Proprietary - Thor Industries, Inc.
