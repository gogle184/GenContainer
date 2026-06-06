import { render, screen } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'
import type { BlogContent } from '@/features/article/types'

const baseArticle: BlogContent = {
  id: 'abc123',
  title: 'はじめての記事',
  content: '<p>本文</p>',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  publishedAt: '2026-06-01T00:00:00.000Z',
  category: {
    id: 'tech',
    name: 'プログラミング',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
}

test('タイトルを表示する', () => {
  render(<ArticleCard article={baseArticle} />)
  expect(screen.getByText('はじめての記事')).toBeInTheDocument()
})

test('カテゴリ名を表示する', () => {
  render(<ArticleCard article={baseArticle} />)
  expect(screen.getByText('プログラミング')).toBeInTheDocument()
})

test('記事詳細へのリンクを持つ', () => {
  render(<ArticleCard article={baseArticle} />)
  const link = screen.getByRole('link', { name: /はじめての記事/ })
  expect(link).toHaveAttribute('href', '/articles/abc123')
})
