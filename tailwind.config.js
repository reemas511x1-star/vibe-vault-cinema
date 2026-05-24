/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          black: '#0a0a0f',
          dark: '#0d0d1a',
          card: '#12121f',
          border: '#1e1e3a',
          gold: '#f5c518',
          red: '#e50914',
          accent: '#6c5ce7',
          glow: '#a29bfe',
        },
      },
      fontFamily: {
        cinematic: ['Outfit', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'rain': 'rain 1s linear infinite',
        'snow': 'snow 3s linear infinite',
        'lightning': 'lightning 0.1s ease-in-out',
        'leaf-fall': 'leafFall 4s ease-in-out infinite',
        'cloud-move': 'cloudMove 20s linear infinite',
        'fog-drift': 'fogDrift 8s ease-in-out infinite',
        'aurora': 'aurora 8s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'typewriter': 'typewriter 3s steps(40) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108, 92, 231, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(108, 92, 231, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        rain: {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        snow: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        leafFall: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(360deg)', opacity: '0' },
        },
        cloudMove: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(calc(100vw + 200px))' },
        },
        fogDrift: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(-5%)' },
          '50%': { opacity: '0.6', transform: 'translateX(5%)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
};
