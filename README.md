# Thor Dealer Portal

The official dealer portal for Thor Industries, providing authorized dealers with access to inventory management, ordering, and business tools.

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ (for development)

### Font Loading

Add the following to your HTML `<head>` to load the required fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### Stylesheet

Include the main stylesheet in your HTML:

```html
<link rel="stylesheet" href="styles/main.css">
```

## Style Guide

This project follows the Thor Industries brand guidelines. All UI development must adhere to the standards defined in our style guide.

### Documentation

- **[Style Guide](docs/STYLE_GUIDE.md)** - Complete documentation of colors, typography, components, and design patterns

### Key Design Principles

1. **Brand Consistency** - All styles are derived from thorindustries.com
2. **Accessibility First** - WCAG 2.1 AA compliant color contrast and keyboard navigation
3. **Mobile Responsive** - Mobile-first approach with responsive breakpoints
4. **Performance** - Optimized CSS with CSS custom properties for theming

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

### File Structure

```
styles/
├── main.css              # Main entry point (imports all files)
├── design-tokens.css     # CSS custom properties
├── reset.css             # CSS reset
├── typography.css        # Font styles
├── utilities.css         # Utility classes
└── components/
    ├── buttons.css       # Button styles
    ├── forms.css         # Form element styles
    ├── cards.css         # Card components
    ├── navigation.css    # Header, sidebar, nav
    ├── tables.css        # Table styles
    └── modals.css        # Modals, dialogs, toasts

docs/
└── STYLE_GUIDE.md        # Complete style documentation
```

### Using Design Tokens

All colors, spacing, and other design values are available as CSS custom properties:

```css
.my-component {
  color: var(--color-charcoal);
  background-color: var(--color-bg-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

### Component Examples

#### Buttons

```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-tertiary">Tertiary Button</button>
```

#### Form Inputs

```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input" placeholder="Enter email">
</div>
```

#### Cards

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-header-title">Card Title</h3>
  </div>
  <div class="card-body">
    Card content goes here.
  </div>
</div>
```

## Development

### CSS Architecture

This project uses a modular CSS architecture:

1. **Design Tokens** - All values defined as CSS custom properties
2. **Reset** - Consistent baseline across browsers
3. **Typography** - Font declarations and text styles
4. **Components** - Reusable UI components
5. **Utilities** - Single-purpose helper classes

### Contributing

When contributing to this project:

1. Follow the established patterns in the style guide
2. Use design tokens (CSS variables) instead of hard-coded values
3. Ensure all components are accessible
4. Test across supported browsers
5. Keep component styles modular and reusable

## License

Proprietary - Thor Industries, Inc.
