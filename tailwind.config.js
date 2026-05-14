/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07070f',
        surface: '#0f0f1a',
        'surface-2': '#15152a',
        border: '#1f1f35',
        accent: '#00e5a0',
        'accent-dim': 'rgba(0,229,160,0.13)',
        text: '#ffffff',
        muted: '#999999',
        dim: '#555555',
        danger: '#ff5577',
      },
      fontFamily: {
        display: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        stat: ['96px', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'stat-lg': ['128px', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
    },
  },
  plugins: [],
}
