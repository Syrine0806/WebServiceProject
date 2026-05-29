import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        surface: '#1e293b',
        bg: '#0f172a',
      },
    },
  },
  plugins: [],
};
export default config;
