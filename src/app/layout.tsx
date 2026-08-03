import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// EDS CSS import order (per eds-installer.md): project CSS first, EDS last —
// EDS styles are the source of truth and override project styles.
import './globals.css'
// NOTE: the package's fonts.css uses Vite-style url() paths that Next.js webpack
// can't resolve — Centra No2 @font-face is declared in globals.css instead,
// serving the font files from public/fonts/eero/.
import '@amzn/eero-web-design-foundation/tokens/tw-styles/color-variables.css'
import '@amzn/eero-web-design-foundation/tokens/tw-styles/light-variables.css'
import '@amzn/eero-web-design-components/library/styles.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'eero Fetch',
  description: 'Track and manage beta and dogfood test devices across programs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} data-theme="light" suppressHydrationWarning>{children}</body>
    </html>
  )
}
