# THORDealerPortal

A comprehensive B2B dealer portal platform for inventory management, order processing, analytics, and dealer communication.

## Status

🚧 **In Development** - Foundation phase complete, Phase 2 (Inventory) in progress

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
│   ├── design-tokens.css
│   └── components/     # Component-specific styles
├── prisma/             # Database schema
├── tests/              # Test suites (506 tests)
├── docs/               # Documentation
└── .ralph/             # Development task tracking
```

## Core Features

- **Dealer Management** - Registration, onboarding, profiles ✅
- **Inventory** - Real-time stock visibility, adjustments, locations ✅
- **Orders** - Cart, checkout, tracking, invoices (Phase 3)
- **Reporting** - Dashboards, analytics, exports (Phase 4)
- **Documents** - Upload, versioning, access control (Phase 5)
- **Notifications** - In-app, email, preferences (Phase 5)

## License

Proprietary - All rights reserved
