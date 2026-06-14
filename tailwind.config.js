/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:           'var(--bg)',
        surface:      'var(--surface)',
        'surface-2':  'var(--surface-2)',
        border:       'var(--border)',
        accent:       'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        text:         'var(--text)',
        muted:        'var(--muted)',
        dim:          'var(--dim)',
        success:      'var(--success)',
        danger:       'var(--danger)',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        sans:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono:    ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    },
  },
  plugins: [],
}
