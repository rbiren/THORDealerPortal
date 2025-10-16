# Contributing to THOR Dealer Portal

Thank you for your interest in contributing to the THOR Dealer Portal! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Prioritize the user experience
- Write maintainable, documented code
- Follow established patterns and conventions

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/THORDealerPortal.git
   cd THORDealerPortal
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/rbiren/THORDealerPortal.git
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Sync with Upstream

Before starting work, ensure your fork is up to date:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write code following our standards
- Add tests for new features
- Update documentation as needed
- Commit frequently with clear messages

### 4. Test Your Changes

```bash
# Backend
cd backend
npm run build
npm run dev

# Frontend
cd frontend
npm run build
npm run dev
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Use conventional commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

1. Go to GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template
5. Submit for review

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary
- Use explicit return types for functions

**Example:**
```typescript
interface User {
  id: string;
  email: string;
  role: 'dealer' | 'technician' | 'admin';
}

const getUser = async (id: string): Promise<User | null> => {
  // Implementation
};
```

### React Components

- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components small and focused
- Use meaningful prop names

**Example:**
```typescript
interface ClaimListProps {
  claims: Claim[];
  onClaimClick: (id: string) => void;
}

const ClaimList: React.FC<ClaimListProps> = ({ claims, onClaimClick }) => {
  // Component implementation
};
```

### File Organization

```
backend/src/
  ├── config/       # Configuration files
  ├── middleware/   # Express middleware
  ├── routes/       # API routes
  ├── types/        # TypeScript types
  └── server.ts     # Main server file

frontend/src/
  ├── components/   # Reusable components
  ├── contexts/     # React contexts
  ├── pages/        # Page components
  ├── services/     # API services
  ├── types/        # TypeScript types
  └── App.tsx       # Main app component
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
  - `UserProfile.tsx`
  - `apiService.ts`
- **Components**: PascalCase
  - `UserProfile`, `ClaimForm`
- **Functions**: camelCase
  - `getUserById`, `submitClaim`
- **Constants**: UPPER_SNAKE_CASE
  - `API_BASE_URL`, `MAX_ATTEMPTS`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use arrow functions for callbacks
- Destructure props and state

```typescript
// Good
const MyComponent: React.FC<Props> = ({ user, onSave }) => {
  const { id, name } = user;
  
  const handleClick = () => {
    onSave(id);
  };
  
  return <div>{name}</div>;
};

// Avoid
const MyComponent = (props) => {
  return <div>{props.user.name}</div>;
};
```

## Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and edge cases
- Mock external dependencies
- Test error handling

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Branch is up to date with main
- [ ] Commit messages are clear and descriptive

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
```

### Review Process

1. Automated checks must pass
2. At least one team member must review
3. All comments must be resolved
4. Maintainer will merge approved PRs

## Project Structure

### Backend Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # Database configuration
│   ├── middleware/
│   │   └── auth.ts          # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts          # Auth endpoints
│   │   ├── dealers.ts       # Dealer endpoints
│   │   ├── technicians.ts   # Technician endpoints
│   │   ├── claims.ts        # Claims endpoints
│   │   ├── repository.ts    # Document endpoints
│   │   └── orders.ts        # Order endpoints
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── server.ts            # Main server
├── package.json
└── tsconfig.json
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── pages/
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── Dashboard.tsx    # Dashboard page
│   │   ├── Claims.tsx       # Claims page
│   │   ├── Repository.tsx   # Documents page
│   │   └── Orders.tsx       # Orders page
│   ├── services/
│   │   └── api.ts           # API service layer
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── package.json
└── vite.config.ts
```

## Adding New Features

### Backend Endpoint

1. Define types in `backend/src/types/index.ts`
2. Create route file in `backend/src/routes/`
3. Implement route handlers
4. Add route to `server.ts`
5. Test with curl or Postman
6. Update API documentation

### Frontend Page

1. Define types in `frontend/src/types/index.ts`
2. Add API methods in `frontend/src/services/api.ts`
3. Create page component in `frontend/src/pages/`
4. Add route to `App.tsx`
5. Test in browser

## Common Tasks

### Adding a New API Endpoint

```typescript
// backend/src/routes/myroute.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Implementation
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
```

### Adding a New Page

```typescript
// frontend/src/pages/MyPage.tsx
import React from 'react';

const MyPage: React.FC = () => {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  );
};

export default MyPage;
```

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Questions?

- Check existing issues and PRs
- Read the documentation
- Ask in discussions
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to THOR Dealer Portal! 🚀
