import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'autarq-hub',
  description: 'Self-hosted orchestration platform — independent, open source, in control.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
