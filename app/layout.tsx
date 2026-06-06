import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { getCategoryList } from '@/features/article/api/getArticles'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_NAME = 'My Blog'

export const metadata: Metadata = {
  title: SITE_NAME,
  description: '個人ブログ',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { contents: categories } = await getCategoryList()

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header siteName={SITE_NAME} categories={categories} />
        {children}
      </body>
    </html>
  )
}
