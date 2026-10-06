/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        fb: {
          bg: 'var(--fb-bg)',
          surface: 'var(--fb-surface)',
          'surface-elevated': 'var(--fb-surface-elevated)',
          text: 'var(--fb-text)',
          primary: 'var(--fb-primary)',
          'primary-soft': 'var(--fb-primary-soft)',
          border: 'var(--fb-border)',
          brand: 'var(--fb-brand)',
          'brand-hover': 'var(--fb-brand-hover)',
          success: 'var(--fb-success)',
          warning: 'var(--fb-warning)',
          danger: 'var(--fb-danger)',
          error: 'var(--fb-error)',
        },
        background: {
          "50": "oklch(0.985 0.004 90)",
          "100": "oklch(0.968 0.008 82)",
          "200": "oklch(0.94 0.014 78)",
          "300": "oklch(0.9 0.02 76)",
          "400": "oklch(0.84 0.025 74)",
          "500": "oklch(0.78 0.03 70)",
          "600": "oklch(0.68 0.025 66)",
          "700": "oklch(0.5 0.02 60)",
          "800": "oklch(0.36 0.015 52)",
          "900": "oklch(0.27 0.012 46)",
          "950": "oklch(0.21 0.01 40)"
        },
        primary: {
          "50": "#FFF0ED",
          "100": "#FFE2DB",
          "200": "#FFC5B8",
          "300": "#FFA490",
          "400": "#FF7B60",
          "500": "#FF4D2E",
          "600": "#E83D1F",
          "700": "#C42D12",
          "800": "#9E240E",
          "900": "#7C1D0B",
          "950": "#4A0E04"
        },
        accent: {
          "50": "oklch(0.975 0.03 155)",
          "100": "oklch(0.94 0.06 155)",
          "200": "oklch(0.88 0.09 150)",
          "300": "oklch(0.8 0.12 148)",
          "400": "oklch(0.71 0.14 152)",
          "500": "oklch(0.63 0.15 150)",
          "600": "oklch(0.55 0.14 148)",
          "700": "oklch(0.45 0.12 147)",
          "800": "oklch(0.36 0.1 145)",
          "900": "oklch(0.28 0.08 145)",
          "950": "oklch(0.22 0.06 145)"
        },
        foreground: {
          "50": "oklch(0.96 0.005 40)",
          "100": "oklch(0.91 0.008 40)",
          "200": "oklch(0.83 0.01 38)",
          "300": "oklch(0.7 0.01 36)",
          "400": "oklch(0.58 0.012 34)",
          "500": "oklch(0.47 0.015 32)",
          "600": "oklch(0.38 0.015 30)",
          "700": "oklch(0.31 0.018 28)",
          "800": "oklch(0.26 0.018 26)",
          "900": "#18181B",
          "950": "#09090B"
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'raise': '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 20px 30px -10px rgba(0, 0, 0, 0.12), 0 8px 12px -4px rgba(0, 0, 0, 0.06)',
      },
    }
  },
  plugins: [],
};