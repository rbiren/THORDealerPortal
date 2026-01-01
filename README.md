# THORDealerPortal

A comprehensive B2B dealer portal platform for inventory management, order processing, analytics, and dealer communication.

## Status

🚧 **In Development** - Foundation phase

## Tech Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL, Redis
- **Infrastructure**: AWS (ECS, RDS, S3, CloudFront)

## Quick Start

```bash
# Clone
git clone <repository-url>
cd THORDealerPortal

# Install (after setup complete)
npm install

# Run
npm run dev
```

## Documentation

| Document | Purpose |
|----------|---------|
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
├── prisma/             # Database schema
├── tests/              # Test suites
├── docs/               # Documentation
└── .ralph/             # Development task tracking
```

## Core Features

- **Dealer Management** - Registration, onboarding, profiles
- **Inventory** - Real-time stock visibility, sync
- **Orders** - Cart, checkout, tracking, invoices
- **Reporting** - Dashboards, analytics, exports
- **Documents** - Upload, versioning, access control
- **Notifications** - In-app, email, preferences

## License

Proprietary - All rights reserved
