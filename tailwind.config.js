/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0D1420',
        surface:      '#121E2D',
        'surface-2':  '#192840',
        border:       '#1E3A52',
        accent:       '#A78BFA',
        'accent-dim': 'rgba(167,139,250,0.14)',
        text:         '#EEF2F7',
        muted:        '#7E94A8',
        dim:          '#3D5470',
        success:      '#4ADE80',
        danger:       '#F87171',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        sans:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono:    ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
}
