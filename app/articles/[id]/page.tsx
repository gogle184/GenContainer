import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticleDetail, getArticleList } from '@/features/article/api/getArticles'
import { ArticleDetailTemplate } from '@/features/article/components/ArticleDetailTemplate'

type Props = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  const { contents } = await getArticleList()
  return contents.map((article) => ({ id: article.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const article = await getArticleDetail(id)
    return { title: article.title }
  } catch {
    return { title: '記事が見つかりません' }
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params

  let article
  try {
    article = await getArticleDetail(id)
  } catch {
    notFound()
  }

  return <ArticleDetailTemplate article={article} />
}
