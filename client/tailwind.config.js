/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom glass colors
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(15, 23, 42, 0.5)',
        },
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
        '4xl': '128px',
      },
      backgroundImage: {
        'gradient-mesh-light': 'radial-gradient(at 40% 20%, rgb(219, 234, 254) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(243, 232, 255) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(254, 249, 195) 0px, transparent 50%), radial-gradient(at 80% 50%, rgb(254, 215, 170) 0px, transparent 50%), radial-gradient(at 0% 100%, rgb(254, 202, 202) 0px, transparent 50%), radial-gradient(at 80% 100%, rgb(191, 219, 254) 0px, transparent 50%), radial-gradient(at 0% 0%, rgb(233, 213, 255) 0px, transparent 50%)',
        'gradient-mesh-dark': 'radial-gradient(at 40% 20%, rgb(30, 27, 75) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(55, 48, 107) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(30, 41, 59) 0px, transparent 50%), radial-gradient(at 80% 50%, rgb(49, 46, 129) 0px, transparent 50%), radial-gradient(at 0% 100%, rgb(31, 41, 55) 0px, transparent 50%), radial-gradient(at 80% 100%, rgb(30, 58, 138) 0px, transparent 50%), radial-gradient(at 0% 0%, rgb(67, 56, 202) 0px, transparent 50%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
