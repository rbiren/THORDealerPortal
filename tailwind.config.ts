import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Thor Industries Brand Colors
      colors: {
        // Primary Colors
        charcoal: {
          DEFAULT: '#181817',
          50: '#f6f6f6',
          100: '#e7e7e6',
          200: '#d1d1d0',
          300: '#b0b0af',
          400: '#888887',
          500: '#6d6d6c',
          600: '#5d5d5c',
          700: '#4f4f4e',
          800: '#454544',
          900: '#3c3c3b',
          950: '#181817',
        },
        'off-white': '#FFFDFA',
        'dark-gray': '#2A2928',

        // Secondary Colors
        olive: {
          DEFAULT: '#495737',
          50: '#f5f7f2',
          100: '#e8ede5',
          200: '#d2dbcb',
          300: '#b1c2a4',
          400: '#8ba578',
          500: '#6b8858',
          600: '#546c45',
          700: '#495737',
          800: '#3a4530',
          900: '#323b2a',
          950: '#181f14',
        },
        'burnt-orange': {
          DEFAULT: '#A46807',
          50: '#fdf8ed',
          100: '#f9eacc',
          200: '#f3d494',
          300: '#ecb85c',
          400: '#e69f35',
          500: '#de831d',
          600: '#c46216',
          700: '#a46807',
          800: '#86500f',
          900: '#6f4311',
          950: '#402205',
        },
        'medium-gray': '#8C8A7E',

        // Neutral Colors
        'light-gray': '#D9D6CF',
        'light-beige': '#F7F4F0',

        // Semantic Colors
        success: {
          DEFAULT: '#495737',
          light: '#E8EDE5',
        },
        warning: {
          DEFAULT: '#A46807',
          light: '#FDF3E3',
        },
        error: {
          DEFAULT: '#B32D2D',
          light: '#FDEAEA',
        },
        info: {
          DEFAULT: '#2A5B8C',
          light: '#E8F0F7',
        },

        // Background shortcuts
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F7F4F0',
        'bg-tertiary': '#D9D6CF',
        'bg-dark': '#181817',
      },

      // Thor Industries Typography
      fontFamily: {
        heading: ['Montserrat', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },

      // Spacing (4px base unit)
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
      },

      // Border Radius
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },

      // Box Shadows
      boxShadow: {
        'xs': '0 1px 2px rgba(24, 24, 23, 0.04)',
        'sm': '0 2px 4px rgba(24, 24, 23, 0.06)',
        'DEFAULT': '0 4px 8px rgba(24, 24, 23, 0.08)',
        'md': '0 4px 8px rgba(24, 24, 23, 0.08)',
        'lg': '0 8px 16px rgba(24, 24, 23, 0.1)',
        'xl': '0 16px 32px rgba(24, 24, 23, 0.12)',
        '2xl': '0 24px 48px rgba(24, 24, 23, 0.16)',
        'focus': '0 0 0 3px rgba(24, 24, 23, 0.1)',
        'focus-error': '0 0 0 3px rgba(179, 45, 45, 0.2)',
      },

      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '300ms',
        'slow': '500ms',
        'slower': '700ms',
      },

      // Z-Index
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'fixed': '300',
        'sidebar': '400',
        'header': '500',
        'drawer': '600',
        'modal-backdrop': '700',
        'modal': '800',
        'popover': '900',
        'tooltip': '1000',
      },

      // Container
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1440px',
      },

      // Layout dimensions
      width: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
      },

      height: {
        'header': '72px',
        'header-mobile': '64px',
      },

      // Margin for sidebar offset
      margin: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
      },
    },
  },
  plugins: [],
}

export default config
