import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ok: '#166534',
        warning: '#9a3412',
        danger: '#991b1b'
      }
    }
  },
  plugins: []
};

export default config;
