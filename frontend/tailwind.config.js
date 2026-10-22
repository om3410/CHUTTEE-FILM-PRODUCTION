export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '375px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          50: '#fdf4f4', 100: '#fbe7e8', 200: '#f5c9cc',
          300: '#eea0a6', 400: '#e26a74', 500: '#d13f4d',
          600: '#b82b3b', 700: '#991f2e', 800: '#7d1c2a', 900: '#671a27',
        },
        gold: {
          50: '#FBF7EA', 100: '#F5EBC6', 200: '#EDD98B', 300: '#E4C55A',
          400: '#D4AF37', 500: '#B8942B', 600: '#937522', 700: '#6E581A',
          800: '#4A3A11', 900: '#2A210A',
        },
        ink: {
          50: '#F7F7F8', 100: '#ECECEE', 200: '#D4D4D8', 300: '#A1A1AA',
          400: '#71717A', 500: '#52525B', 600: '#3F3F46', 700: '#27272A',
          800: '#18181B', 900: '#0F0F11', 950: '#0A0A0A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { premium: '0.875rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)',
        gold: '0 0 0 1px rgba(212,175,55,0.25), 0 8px 30px -10px rgba(212,175,55,0.35)',
        glow: '0 0 40px -10px rgba(212,175,55,0.45)',
      },
      transitionTimingFunction: { premium: 'cubic-bezier(0.22,1,0.36,1)' },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn: { '0%': { transform: 'scale(0.95)' }, '100%': { transform: 'scale(1)' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { '0%': { transform: 'translateX(20px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,175,55,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};