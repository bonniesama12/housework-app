import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAFBFC',
          card: '#FFFFFF',
        },
        border: '#E8ECF0',
        text: {
          primary: '#1A1D21',
          secondary: '#6B7280',
        },
        accent: {
          green: '#10B981',
          red: '#EF4444',
          orange: '#F59E0B',
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
        holiday: {
          bg: '#FEF3C7',
          text: '#92400E',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"DIN Alternate"', '"Roboto Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        tag: '6px',
      },
    },
  },
  plugins: [],
}
export default config
