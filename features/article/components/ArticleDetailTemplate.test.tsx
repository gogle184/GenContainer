import { render, screen } from '@testing-library/react'
import { ArticleDetailTemplate } from './ArticleDetailTemplate'
import type { BlogContent } from '@/features/article/types'

const article: BlogContent = {
  id: 'abc123',
  title: '詳細記事',
  content: '<p>これは本文です</p>',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  publishedAt: '2026-06-01T00:00:00.000Z',
  tags: [
    { id: 'nextjs', name: 'Next.js', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
  ],
}

test('タイトルを表示する', () => {
  render(<ArticleDetailTemplate article={article} />)
  expect(screen.getByRole('heading', { name: '詳細記事' })).toBeInTheDocument()
})

test('本文HTMLを描画する', () => {
  render(<ArticleDetailTemplate article={article} />)
  expect(screen.getByText('これは本文です')).toBeInTheDocument()
})

test('タグへのリンクを持つ', () => {
  render(<ArticleDetailTemplate article={article} />)
  const link = screen.getByRole('link', { name: 'Next.js' })
  expect(link).toHaveAttribute('href', '/tags/nextjs')
})
