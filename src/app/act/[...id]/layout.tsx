import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './style.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI写作',
  description: '移动端活动页面',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
}

export default function ActLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body className="mobile-container">
        <div className="mobile-viewport">
          {children}
        </div>
      </body>
    </html>
  )
}
