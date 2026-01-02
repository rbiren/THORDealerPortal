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

### Font Loading

Add the following to your HTML `<head>` to load the required fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

## Documentation

| Document | Purpose |
|----------|---------|
| [Project Plan](docs/PROJECT_PLAN.md) | Architecture, phases, technical specs |
| [Style Guide](docs/STYLE_GUIDE.md) | Colors, typography, components, design patterns |
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
├── styles/             # CSS stylesheets
│   ├── main.css        # Main entry point
│   ├── design-tokens.css
│   └── components/     # Component styles
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
