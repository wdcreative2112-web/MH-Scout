import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        scout: {
          50: '#f2f9f5',
          100: '#e1f2e8',
          200: '#c4e5d2',
          300: '#97d1b3',
          400: '#64b68f',
          500: '#3e9b70',
          600: '#2d7d58',
          700: '#246447',
          800: '#1e4f3a',
          900: '#184231',
          950: '#0c241b',
        },
        cacao: {
          50: '#fdf8f4',
          100: '#fbf0e8',
          200: '#f5ded0',
          300: '#ecc5ad',
          400: '#dfa283',
          500: '#d2825d',
          600: '#b86644',
          700: '#944e36',
          800: '#79402f',
          900: '#64372b',
          950: '#381c15',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'var(--font-poppins)', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
