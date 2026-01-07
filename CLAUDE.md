# CLAUDE.md - AI Assistant Guidelines for THORDealerPortal

This document provides guidance for AI assistants working with the THORDealerPortal codebase.

## Project Overview

**THORDealerPortal** is a comprehensive B2B dealer portal platform enabling dealers to manage inventory, process orders, access analytics, and communicate with the organization.

### Current Status

- **Stage**: Active development (Phase 8+ features)
- **Completed**: Authentication, Dashboard, Inventory, Orders, Invoices, Warranty Claims, Community Forum, Support Tickets, Documents, Reports, Cart/Checkout, Notifications, Incentives & Rebates
- **Branch Strategy**: Feature branches prefixed with `claude/` for AI-assisted development
- **Development Approach**: Ralph Wiggum autonomous loops for iterative implementation

### Key Documentation

- **Project Plan**: `docs/PROJECT_PLAN.md` - Complete architecture, phases, and technical specifications
- **Task Backlog**: `.ralph/TASK_BACKLOG.md` - Development tasks with ready-to-run commands

---

## Repository Structure

```
THORDealerPortal/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Main dealer dashboard
│   │   ├── products/     # Product catalog
│   │   ├── cart/         # Shopping cart & checkout
│   │   ├── orders/       # Order processing
│   │   ├── invoices/     # Invoice management
│   │   ├── documents/    # Document management
│   │   ├── warranty/     # Warranty claims module
│   │   ├── incentives/   # Dealer incentives & rebates
│   │   ├── reports/      # Sales & inventory reports
│   │   ├── forum/        # Community forum for dealers
│   │   ├── support/      # Support tickets
│   │   ├── notifications/# Notification center
│   │   ├── admin/        # Admin management pages
│   │   └── api/          # API routes
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities, services, validations
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema and migrations
├── styles/               # Design system CSS
├── docs/                 # Technical documentation
└── .ralph/               # Development task tracking
```

---

## Documentation Rules

### File Placement

| Type | Location | When to Create |
|------|----------|----------------|
| AI guidelines | `CLAUDE.md` (root) | Already exists - update only |
| Project info | `README.md` (root) | Already exists - update only |
| Technical specs | `docs/` | Architecture, API docs, design decisions |
| Ralph state | `.ralph/` | Progress files during active loops only |
| Code docs | Inline/JSDoc | With the code itself |

### Do NOT Create

- ❌ Separate README files in subdirectories
- ❌ CHANGELOG.md (use git history + CLAUDE.md changelog section)
- ❌ CONTRIBUTING.md (covered in CLAUDE.md)
- ❌ Multiple markdown files for single features
- ❌ Documentation that duplicates code comments

### When to Create New Docs

Only create new `.md` files when:
1. Content exceeds 200 lines AND serves a distinct purpose
2. Multiple developers need standalone reference material
3. Content is reusable across projects (e.g., style guides)

### Documentation Updates

- Update existing docs rather than creating new ones
- Keep `CLAUDE.md` under 300 lines
- Remove placeholder sections when implementing features
- Delete `.ralph/progress.md` after completing Ralph loops

### Push Protocol

**Before every push**, complete these steps:

1. Run tests: `npm test`
2. Update `.ralph/TASK_BACKLOG.md`:
   - Mark task status ✅ in phase table
   - Add row to "Completed Tasks" section
3. If schema changed: verify `npm run db:push` works
4. Commit with task ID: `feat(0.1.1): Description`

---

## Code Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `DealerDashboard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Constants: `SCREAMING_SNAKE_CASE` values, `camelCase.ts` files
- Tests: `*.test.ts` or `*.spec.ts`

### Code Style

- TypeScript for all code
- Functional React components with hooks
- async/await over Promise chains
- Named constants over magic numbers
- Zod for runtime validation

### Commit Messages

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## AI Assistant Guidelines

### Do

- Read files before modifying
- Follow existing patterns
- Make minimal, focused changes
- Run tests after changes
- Use task backlog IDs when implementing features

### Don't

- Over-engineer solutions
- Add unnecessary abstractions
- Create documentation files without need
- Modify unrelated code
- Skip security considerations (OWASP top 10)

---

## Ralph Wiggum Quick Reference

```bash
# Start a loop (always set max-iterations)
/ralph-loop "Task description" --max-iterations 20

# Cancel
/cancel-ralph
```

### Memory Process

1. **Git history** - Commit frequently with clear messages
2. **File state** - Changes persist between iterations
3. **Progress files** - Use `.ralph/progress.md` for complex tasks (delete when done)

Full guide: `docs/RALPH_WIGGUM_GUIDE.md`

---

## Getting Started

```bash
# First time setup
npm install
npm run db:setup    # Generate Prisma + push schema + seed

# Development
npm run dev         # Start Next.js dev server
npm run db:studio   # Open Prisma Studio GUI

# Testing
npm test            # Run all tests
npm run test:watch  # Watch mode
```

---

## Security Checklist

- [ ] Input validation (Zod schemas)
- [ ] Parameterized queries (Prisma)
- [ ] XSS prevention (React escaping)
- [ ] CSRF tokens
- [ ] Auth on all protected routes
- [ ] No secrets in code

---

*Last updated: January 2026*
