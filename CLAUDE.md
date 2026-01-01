# CLAUDE.md - AI Assistant Guidelines for THORDealerPortal

This document provides guidance for AI assistants working with the THORDealerPortal codebase.

## Project Overview

**THORDealerPortal** is a comprehensive B2B dealer portal platform enabling dealers to manage inventory, process orders, access analytics, and communicate with the organization.

### Current Status

- **Stage**: Initial setup (foundation phase)
- **Branch Strategy**: Feature branches prefixed with `claude/` for AI-assisted development
- **Development Approach**: Ralph Wiggum autonomous loops for iterative implementation

### Key Documentation

- **Project Plan**: `docs/PROJECT_PLAN.md` - Complete architecture, phases, and technical specifications
- **Task Backlog**: `.ralph/TASK_BACKLOG.md` - 117 tasks across 7 phases with ready-to-run commands

---

## Repository Structure

```
THORDealerPortal/
├── README.md           # Project overview and setup instructions
├── CLAUDE.md           # This file - AI assistant guidelines
├── docs/               # Documentation
│   ├── PROJECT_PLAN.md        # Complete project plan and architecture
│   └── RALPH_WIGGUM_GUIDE.md  # Ralph Wiggum autonomous loop guide
├── .ralph/             # Ralph Wiggum loop state and templates
│   ├── PROGRESS_TEMPLATE.md   # Progress tracking template
│   └── TASK_BACKLOG.md        # Comprehensive task backlog (117 tasks)
└── (future directories to be added)
```

### Planned Directory Structure

As the project develops, expect the following structure:

```
THORDealerPortal/
├── src/                # Source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components/routes
│   ├── services/       # API clients and business logic
│   ├── utils/          # Utility functions
│   ├── hooks/          # Custom React hooks (if React)
│   ├── types/          # TypeScript type definitions
│   └── styles/         # Global styles and theme
├── tests/              # Test files
├── public/             # Static assets
├── docs/               # Documentation
└── config/             # Configuration files
```

---

## Development Workflow

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd THORDealerPortal

# Install dependencies (when package.json is added)
npm install

# Start development server
npm run dev
```

### Branch Naming Conventions

- `main` or `master` - Production-ready code
- `develop` - Integration branch for features
- `feature/<description>` - New features
- `bugfix/<description>` - Bug fixes
- `claude/<description>` - AI-assisted development branches

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

---

## Code Conventions

### General Guidelines

1. **Keep it simple** - Avoid over-engineering; implement only what's needed
2. **Be consistent** - Follow existing patterns in the codebase
3. **Document intent** - Comments should explain "why", not "what"
4. **Test critical paths** - Focus testing on business-critical functionality

### File Naming

- Components: `PascalCase.tsx` (e.g., `DealerDashboard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Constants: `SCREAMING_SNAKE_CASE` for values, `camelCase.ts` for files
- Test files: `*.test.ts` or `*.spec.ts`

### Code Style

- Use TypeScript for type safety
- Prefer functional components and hooks (React)
- Use async/await over Promise chains
- Destructure objects and arrays when practical
- Avoid magic numbers - use named constants

---

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests for isolated functions
├── integration/    # Integration tests for combined functionality
└── e2e/            # End-to-end tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## Common Tasks

### Adding a New Feature

1. Create a feature branch from `develop`
2. Implement the feature with tests
3. Update documentation if needed
4. Create a pull request

### Fixing a Bug

1. Create a bugfix branch
2. Write a failing test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Create a pull request

---

## Ralph Wiggum Autonomous Loops

This project supports the Ralph Wiggum plugin for autonomous, iterative AI development.

### Quick Start

```bash
# Install the plugin
/plugin marketplace add anthropics/claude-code
/plugin install ralph-wiggum@claude-code-plugins

# Start a development loop
/ralph-loop "Implement feature X with tests" --max-iterations 20

# Cancel if needed
/cancel-ralph
```

### Key Principles

1. **Always set max iterations** - Use `--max-iterations` as your safety limit
2. **Use TDD** - Write tests first, let Ralph implement until green
3. **Clear completion criteria** - Use `--completion-promise "ALL TESTS PASS"`
4. **Track progress** - Use `.ralph/` templates for complex tasks

### Memory Process

Ralph maintains context through:
- **Git history** - Each iteration sees previous commits
- **File state** - Modified files persist between iterations
- **Progress files** - Use `.ralph/progress.md` for explicit tracking

### Documentation

- Full guide: `docs/RALPH_WIGGUM_GUIDE.md`
- Progress template: `.ralph/PROGRESS_TEMPLATE.md`
- Task backlog: `.ralph/TASK_BACKLOG.md`

---

## AI Assistant Guidelines

### Do's

- **Read before modifying** - Always read files before making changes
- **Use existing patterns** - Follow conventions already established in the codebase
- **Make minimal changes** - Only change what's necessary to complete the task
- **Verify your work** - Run tests and linting after making changes
- **Explain your reasoning** - Communicate what you're doing and why

### Don'ts

- **Don't over-engineer** - Avoid adding unnecessary abstractions or features
- **Don't ignore errors** - Address warnings and errors, don't suppress them
- **Don't make assumptions** - Ask for clarification when requirements are unclear
- **Don't modify unrelated code** - Stay focused on the task at hand
- **Don't skip security considerations** - Be mindful of OWASP top 10 vulnerabilities

### Security Considerations

When writing code, always consider:
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)
- XSS prevention (escape user content)
- CSRF protection
- Proper authentication and authorization
- Secure handling of sensitive data

---

## Troubleshooting

### Common Issues

*(To be documented as issues arise)*

### Getting Help

- Check existing documentation
- Review similar implementations in the codebase
- Ask for clarification on requirements

---

## Dependencies

### Core Dependencies

*(To be added when package.json is created)*

### Development Dependencies

*(To be added when package.json is created)*

---

## Environment Variables

*(To be documented when .env.example is created)*

Example format:
```env
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://...

# Authentication
AUTH_SECRET=your-secret-key
```

---

## Deployment

### Environments

- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live environment

### Deployment Process

*(To be documented when CI/CD is configured)*

---

## Changelog

### [Unreleased]
- Initial repository setup
- Added CLAUDE.md documentation
- Added Ralph Wiggum autonomous loop guide and templates
- Created `.ralph/` directory with progress tracking templates
- Created comprehensive project plan with 7 development phases
- Added detailed task backlog with 117 tasks and ready-to-run Ralph commands
- Documented system architecture, database design, and API specifications

---

*Last updated: January 2026*
