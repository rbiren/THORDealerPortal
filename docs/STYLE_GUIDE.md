# Thor Dealer Portal - Web Development Style Guide

This document defines the visual design standards, component patterns, and development guidelines for the Thor Dealer Portal. All styles are derived from the official Thor Industries brand guidelines as seen on thorindustries.com.

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons & Imagery](#icons--imagery)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Implementation](#implementation)

---

## Brand Overview

### Design Philosophy
The Thor Dealer Portal embodies a **modern, minimalist aesthetic** focused on:
- Clean, professional layouts with ample whitespace
- Clear visual hierarchy through typography and spacing
- Subtle, purposeful animations
- Accessibility-first approach
- Mobile-responsive design

### Visual Identity Keywords
- Professional
- Trustworthy
- Outdoor/Adventure-oriented
- Family-focused
- Premium quality

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Charcoal** | `#181817` | rgb(24, 24, 23) | Primary backgrounds, text, headers |
| **Off-White** | `#FFFDFA` | rgb(255, 253, 250) | Primary light backgrounds, contrast text |
| **Dark Gray** | `#2A2928` | rgb(42, 41, 40) | Buttons, secondary backgrounds |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Olive Green** | `#495737` | rgb(73, 87, 55) | Accents, success states, nature elements |
| **Burnt Orange** | `#A46807` | rgb(164, 104, 7) | Warnings, calls-to-action, highlights |
| **Medium Gray** | `#8C8A7E` | rgb(140, 138, 126) | Secondary text, borders, dividers |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Light Gray** | `#D9D6CF` | rgb(217, 214, 207) | Borders, disabled states |
| **Light Beige** | `#F7F4F0` | rgb(247, 244, 240) | Alternate backgrounds, cards |
| **Pure Black** | `#000000` | rgb(0, 0, 0) | Mobile footer, high contrast |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Pure white elements |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#495737` | Confirmations, completed states |
| **Warning** | `#A46807` | Cautions, pending states |
| **Error** | `#B32D2D` | Errors, destructive actions |
| **Info** | `#2A5B8C` | Information, help text |

### Color Usage Guidelines

```
DO:
- Use Charcoal (#181817) for primary text on light backgrounds
- Use Off-White (#FFFDFA) for text on dark backgrounds
- Use Olive Green sparingly for positive/success states
- Maintain 4.5:1 contrast ratio minimum for text

DON'T:
- Use pure black (#000) for body text (too harsh)
- Mix multiple accent colors in one component
- Use Burnt Orange for large background areas
```

---

## Typography

### Font Families

#### Primary Font: Montserrat
- **Usage**: Headings, navigation, buttons, labels
- **Weights**: 600 (Semi-Bold), 700 (Bold), 800 (Extra-Bold)
- **Style**: Often used in UPPERCASE for headings
- **Fallback**: `'Montserrat', 'Helvetica Neue', Arial, sans-serif`

#### Secondary Font: Open Sans
- **Usage**: Body copy, descriptions, form inputs, tables
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semi-Bold)
- **Fallback**: `'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif`

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height | Letter Spacing |
|---------|----------------|---------------|--------|-------------|----------------|
| **H1** | 3rem (48px) | 2.25rem (36px) | 800 | 1.1 | -0.02em |
| **H2** | 2.25rem (36px) | 1.75rem (28px) | 800 | 1.2 | -0.01em |
| **H3** | 1.5rem (24px) | 1.25rem (20px) | 700 | 1.3 | 0 |
| **H4** | 1.25rem (20px) | 1.125rem (18px) | 700 | 1.4 | 0 |
| **H5** | 1rem (16px) | 1rem (16px) | 600 | 1.4 | 0.02em |
| **H6** | 0.875rem (14px) | 0.875rem (14px) | 600 | 1.4 | 0.03em |
| **Body Large** | 1.125rem (18px) | 1rem (16px) | 400 | 1.6 | 0 |
| **Body** | 1rem (16px) | 0.9375rem (15px) | 400 | 1.6 | 0 |
| **Body Small** | 0.875rem (14px) | 0.875rem (14px) | 400 | 1.5 | 0 |
| **Caption** | 0.75rem (12px) | 0.75rem (12px) | 400 | 1.4 | 0.02em |

### Typography Guidelines

```css
/* Heading Style */
h1, h2, h3 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-charcoal);
}

/* Body Style */
p, span, li {
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
  color: var(--color-charcoal);
  line-height: 1.6;
}
```

---

## Spacing & Layout

### Spacing Scale

Use a consistent 4px base unit for all spacing:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icons |
| `--space-2` | 8px | Form elements, inline items |
| `--space-3` | 12px | Small gaps, list items |
| `--space-4` | 16px | Default spacing, paragraphs |
| `--space-5` | 24px | Section padding (mobile) |
| `--space-6` | 32px | Card padding |
| `--space-7` | 48px | Section padding (tablet) |
| `--space-8` | 64px | Large sections |
| `--space-9` | 96px | Section padding (desktop) |

### Container Widths

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| Mobile | 100% | 16px |
| Tablet (768px+) | 720px | 24px |
| Desktop (1024px+) | 960px | 32px |
| Large (1280px+) | 1200px | 40px |
| XLarge (1440px+) | 1400px | 48px |

### Grid System

Use a 12-column grid system:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Example usage */
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }
```

### Layout Patterns

#### Page Layout
```
┌─────────────────────────────────┐
│           Header (fixed)        │
├─────────────────────────────────┤
│                                 │
│           Main Content          │
│      (max-width container)      │
│                                 │
├─────────────────────────────────┤
│             Footer              │
└─────────────────────────────────┘
```

#### Dashboard Layout
```
┌─────────────────────────────────┐
│           Header (fixed)        │
├──────┬──────────────────────────┤
│      │                          │
│ Side │     Content Area         │
│ Nav  │                          │
│      │                          │
├──────┴──────────────────────────┤
│             Footer              │
└─────────────────────────────────┘
```

---

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background-color: var(--color-dark-gray);
  color: var(--color-off-white);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background-color: var(--color-charcoal);
}

.btn-primary:focus {
  outline: 2px solid var(--color-burnt-orange);
  outline-offset: 2px;
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: var(--color-charcoal);
  border: 2px solid var(--color-charcoal);
  /* Same typography as primary */
}

.btn-secondary:hover {
  background-color: var(--color-charcoal);
  color: var(--color-off-white);
}
```

#### Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 8px 16px | 0.75rem |
| Medium | 12px 24px | 0.875rem |
| Large | 16px 32px | 1rem |

### Form Elements

#### Input Fields
```css
.input {
  font-family: 'Open Sans', sans-serif;
  font-size: 1rem;
  padding: 12px 16px;
  border: 1px solid var(--color-light-gray);
  border-radius: 4px;
  background-color: var(--color-white);
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-charcoal);
  outline: none;
  box-shadow: 0 0 0 3px rgba(24, 24, 23, 0.1);
}

.input::placeholder {
  color: var(--color-medium-gray);
}
```

#### Labels
```css
.label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-charcoal);
  margin-bottom: 8px;
  display: block;
}
```

### Cards

```css
.card {
  background-color: var(--color-white);
  border-radius: 8px;
  padding: var(--space-6);
  box-shadow: 0 2px 8px rgba(24, 24, 23, 0.08);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(24, 24, 23, 0.12);
}

.card-header {
  border-bottom: 1px solid var(--color-light-gray);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}
```

### Navigation

#### Header Navigation
```css
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background-color: var(--color-charcoal);
  z-index: 1000;
}

.nav-link {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-off-white);
  text-decoration: none;
  padding: 8px 16px;
  transition: opacity 0.2s ease;
}

.nav-link:hover {
  opacity: 0.8;
}
```

#### Sidebar Navigation
```css
.sidebar {
  width: 260px;
  background-color: var(--color-charcoal);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 72px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: var(--color-off-white);
  font-family: 'Open Sans', sans-serif;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.sidebar-link:hover,
.sidebar-link.active {
  background-color: rgba(255, 253, 250, 0.1);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Open Sans', sans-serif;
}

.table th {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-medium-gray);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--color-light-gray);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-light-gray);
  color: var(--color-charcoal);
}

.table tr:hover {
  background-color: var(--color-light-beige);
}
```

### Modals

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(24, 24, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background-color: var(--color-white);
  border-radius: 12px;
  max-width: 560px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(24, 24, 23, 0.2);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-light-gray);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-light-gray);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## Icons & Imagery

### Icon Guidelines

- **Size**: 24px default, 16px small, 32px large
- **Color**: Inherit from parent or use `currentColor`
- **Style**: Outlined/stroke icons preferred for UI
- **Library**: Use consistent icon library (e.g., Lucide, Heroicons)

### Image Guidelines

- Use WebP format with JPEG fallback
- Implement lazy loading for below-fold images
- Provide appropriate alt text for accessibility
- Maintain aspect ratios (16:9 for hero, 4:3 for cards)

### Logo Usage

| Context | Height | Format |
|---------|--------|--------|
| Header (Desktop) | 72px | SVG |
| Header (Mobile) | 50px | SVG |
| Footer | 48px | SVG |
| Favicon | 32px | ICO/PNG |

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 576px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
--breakpoint-xxl: 1440px; /* Extra large */
```

### Media Query Usage

```css
/* Mobile styles (default) */
.component { /* mobile styles */ }

/* Tablet and up */
@media (min-width: 768px) {
  .component { /* tablet styles */ }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component { /* desktop styles */ }
}
```

### Responsive Typography

```css
html {
  font-size: 16px; /* Base */
}

@media (min-width: 768px) {
  html {
    font-size: 17px;
  }
}

@media (min-width: 1280px) {
  html {
    font-size: 18px;
  }
}
```

---

## Accessibility

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 minimum

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-burnt-orange);
  outline-offset: 2px;
}
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Maintain logical tab order
- Provide skip links for main content

### Screen Reader Support

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure form fields have associated labels

---

## Implementation

### File Structure

```
styles/
├── design-tokens.css    # CSS custom properties
├── reset.css            # CSS reset/normalize
├── typography.css       # Font declarations and type scale
├── components/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   ├── navigation.css
│   ├── tables.css
│   └── modals.css
├── layouts/
│   ├── grid.css
│   ├── header.css
│   ├── sidebar.css
│   └── footer.css
└── utilities/
    ├── spacing.css
    ├── display.css
    └── text.css
```

### CSS Import Order

```css
/* main.css */
@import 'design-tokens.css';
@import 'reset.css';
@import 'typography.css';
@import 'components/buttons.css';
@import 'components/forms.css';
/* ... additional imports */
```

### Loading Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Animation & Transitions

### Timing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration

| Type | Duration | Usage |
|------|----------|-------|
| Fast | 150ms | Hover states, tooltips |
| Normal | 300ms | Buttons, form elements |
| Slow | 500ms | Modals, page transitions |

### Standard Transitions

```css
.transition-colors {
  transition: color 0.3s var(--ease-default),
              background-color 0.3s var(--ease-default),
              border-color 0.3s var(--ease-default);
}

.transition-transform {
  transition: transform 0.3s var(--ease-default);
}

.transition-opacity {
  transition: opacity 0.3s var(--ease-default);
}
```

---

## Quick Reference

### CSS Variables (Design Tokens)

```css
:root {
  /* Colors */
  --color-charcoal: #181817;
  --color-off-white: #FFFDFA;
  --color-dark-gray: #2A2928;
  --color-olive-green: #495737;
  --color-burnt-orange: #A46807;
  --color-medium-gray: #8C8A7E;
  --color-light-gray: #D9D6CF;
  --color-light-beige: #F7F4F0;

  /* Typography */
  --font-heading: 'Montserrat', sans-serif;
  --font-body: 'Open Sans', sans-serif;

  /* Spacing */
  --space-unit: 4px;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(24, 24, 23, 0.05);
  --shadow-md: 0 4px 8px rgba(24, 24, 23, 0.08);
  --shadow-lg: 0 8px 24px rgba(24, 24, 23, 0.12);
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-01 | Initial style guide based on thorindustries.com |

---

*This style guide should be referenced for all UI development on the Thor Dealer Portal. For questions or proposed changes, please contact the design team.*
