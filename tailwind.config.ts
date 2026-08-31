import type { Config } from 'tailwindcss'

const config: Config = {
  // EDS foundation preset — maps all eero design tokens (colors, spacing,
  // typography, radius, elevation) to Tailwind utilities.
  presets: [require('@amzn/eero-web-design-foundation/tokens/tw-styles/tw-custom-preset.js')],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/constants/**/*.{js,ts,jsx,tsx,mdx}',
    './src/store/**/*.{js,ts,jsx,tsx,mdx}',
    // WDS components use Tailwind classes internally — required content path.
    './node_modules/@amzn/eero-web-design-components/library/**/*.{js,css}',
  ],
  plugins: [],
}
export default config
