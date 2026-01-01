# Ralph Wiggum Development Guide

This guide covers using the Ralph Wiggum plugin for autonomous, iterative AI development on THORDealerPortal.

## What is Ralph Wiggum?

Ralph Wiggum is an official Anthropic plugin that enables autonomous development loops in Claude Code. Named after the Simpsons character, it embodies the philosophy of persistent iteration—keep trying until success.

**Core Concept**: "Ralph is a Bash loop" - a simple `while true` that repeatedly feeds Claude a prompt, allowing iterative improvement until completion.

### How It Works

1. You start a loop with a task description
2. Claude works on the task
3. When Claude tries to exit, the Stop hook intercepts
4. The original prompt is re-fed with updated context (file changes, git history)
5. Claude reviews its previous work and continues refining
6. Loop ends when completion criteria are met or max iterations reached

---

## Installation

```bash
# Install from marketplace
/plugin marketplace add anthropics/claude-code
/plugin install ralph-wiggum@claude-code-plugins
```

---

## Usage

### Basic Syntax

```bash
/ralph-loop "<task description>" --completion-promise "<done signal>" --max-iterations <number>
```

### Examples

```bash
# Basic feature implementation
/ralph-loop "Implement user authentication with JWT tokens" --max-iterations 20

# Test-driven development
/ralph-loop "Write tests for DealerService and make them pass" --completion-promise "ALL TESTS PASS" --max-iterations 30

# Bug fixing
/ralph-loop "Fix the inventory sync bug - tests must pass" --max-iterations 15

# Refactoring
/ralph-loop "Refactor API endpoints to use async/await pattern" --max-iterations 25
```

### Stopping a Loop

```bash
/cancel-ralph
```

---

## Development Plan Template

Use this template when starting Ralph Wiggum loops for major features:

```markdown
## Feature: [Feature Name]

### Objective
[Clear, concise description of what needs to be built]

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests pass
- [ ] No linting errors

### Completion Promise
"[Exact phrase Claude should output when done, e.g., 'FEATURE COMPLETE']"

### Max Iterations
[Number, typically 20-50 for major features]

### Context Files
- `path/to/relevant/file1.ts`
- `path/to/relevant/file2.ts`

### Dependencies
- [Any external dependencies or prerequisites]

### Constraints
- [Any limitations or requirements to follow]
```

---

## Memory Process

Ralph Wiggum maintains context across iterations through:

### 1. Git History Memory

Each iteration sees the git history from previous runs. Structure commits clearly:

```bash
# Good commit messages help Claude understand previous work
git commit -m "feat(auth): Add JWT token generation - iteration 3"
git commit -m "fix(auth): Resolve token expiration issue - iteration 4"
```

### 2. File State Memory

Modified files persist between iterations. Claude reads its previous changes.

### 3. Progress Tracking Files

Create explicit memory files for complex tasks:

```markdown
<!-- .ralph/progress.md -->
# Current Progress

## Completed
- [x] Set up authentication middleware
- [x] Create user model

## In Progress
- [ ] Implement token refresh logic

## Blockers
- Need to resolve circular dependency in services/

## Next Steps
1. Fix the circular dependency
2. Add refresh token endpoint
3. Write integration tests
```

### 4. Task State Files

```markdown
<!-- .ralph/state.json -->
{
  "feature": "user-authentication",
  "iteration": 5,
  "phase": "testing",
  "testsPassng": 12,
  "testsFailing": 3,
  "lastError": "TokenService undefined in test context",
  "nextAction": "Fix dependency injection in test setup"
}
```

---

## Task List Templates

### Feature Development Task List

```markdown
# Feature: [Name]
Start: /ralph-loop "[description]" --max-iterations 30

## Phase 1: Setup (Iterations 1-5)
- [ ] Create directory structure
- [ ] Set up base types/interfaces
- [ ] Create placeholder files

## Phase 2: Core Implementation (Iterations 6-15)
- [ ] Implement main business logic
- [ ] Add data models
- [ ] Create service layer

## Phase 3: API/UI Layer (Iterations 16-22)
- [ ] Create API endpoints / UI components
- [ ] Add validation
- [ ] Implement error handling

## Phase 4: Testing & Polish (Iterations 23-30)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Fix edge cases
- [ ] Documentation
```

### Bug Fix Task List

```markdown
# Bug: [Description]
Start: /ralph-loop "Fix: [bug description]" --max-iterations 15

## Phase 1: Investigation (Iterations 1-3)
- [ ] Reproduce the bug
- [ ] Identify root cause
- [ ] Document findings

## Phase 2: Fix (Iterations 4-10)
- [ ] Write failing test
- [ ] Implement fix
- [ ] Verify test passes

## Phase 3: Validation (Iterations 11-15)
- [ ] Run full test suite
- [ ] Check for regressions
- [ ] Update documentation
```

### Refactoring Task List

```markdown
# Refactor: [Description]
Start: /ralph-loop "Refactor: [description]" --max-iterations 25

## Phase 1: Analysis (Iterations 1-5)
- [ ] Map current implementation
- [ ] Identify refactoring targets
- [ ] Plan migration path

## Phase 2: Incremental Changes (Iterations 6-20)
- [ ] Refactor module by module
- [ ] Maintain test coverage
- [ ] Keep system functional

## Phase 3: Cleanup (Iterations 21-25)
- [ ] Remove deprecated code
- [ ] Update imports
- [ ] Final test pass
```

---

## Best Practices

### 1. Always Set Max Iterations

```bash
# Good - has safety limit
/ralph-loop "Build feature X" --max-iterations 20

# Risky - no limit
/ralph-loop "Build feature X"
```

### 2. Write Clear Completion Promises

```bash
# Good - specific and verifiable
--completion-promise "ALL TESTS PASS AND LINT CLEAN"

# Vague - hard for Claude to verify
--completion-promise "done"
```

### 3. Use Test-Driven Development

Ralph Wiggum excels at TDD:
1. Write failing tests first
2. Let the loop implement until tests pass
3. Tests provide clear completion criteria

### 4. Start Small

Begin with focused tasks before complex features:

```bash
# Start here
/ralph-loop "Add user model with email validation" --max-iterations 10

# Then expand
/ralph-loop "Add user registration endpoint" --max-iterations 15
```

### 5. Create Progress Checkpoints

For long-running tasks, use git tags:

```bash
git tag ralph-checkpoint-1
git tag ralph-checkpoint-2
```

### 6. Monitor Costs

Track API usage for budget awareness. Complex loops can consume significant tokens.

---

## THORDealerPortal Specific Workflows

### Dealer Feature Development

```bash
/ralph-loop "Implement dealer onboarding flow with:
- Dealer registration form
- Document upload
- Admin approval workflow
- Email notifications
All tests must pass" --max-iterations 40 --completion-promise "DEALER ONBOARDING COMPLETE"
```

### Inventory Management

```bash
/ralph-loop "Build inventory sync service:
- Pull from external API
- Transform to internal format
- Update database
- Handle conflicts
Include retry logic and error handling" --max-iterations 30
```

### Report Generation

```bash
/ralph-loop "Create dealer performance report generator:
- Sales metrics
- Inventory turnover
- Customer satisfaction
- PDF export
Write comprehensive tests" --max-iterations 25
```

---

## Troubleshooting

### Loop Not Stopping

```bash
/cancel-ralph
```

If unresponsive, use Ctrl+C.

### Circular Iterations

If Claude keeps repeating the same changes:
1. Cancel the loop
2. Review and commit good changes
3. Update the prompt with more specific guidance
4. Restart with lower iteration limit

### High Token Usage

- Use smaller, focused prompts
- Break large features into sub-tasks
- Set reasonable iteration limits

---

## Resources

- [Official Ralph Wiggum Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)
- [Ralph Wiggum README](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)
- [Autonomous Loops Blog Post](https://paddo.dev/blog/ralph-wiggum-autonomous-loops/)
- [Awesome Claude - Ralph Wiggum](https://awesomeclaude.ai/ralph-wiggum)

---

*Last updated: January 2026*
