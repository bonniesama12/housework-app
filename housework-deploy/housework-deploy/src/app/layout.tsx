import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '家庭家务管理系统',
  description: '记录老公每个月完成的家务情况',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
