import { notFound } from 'next/navigation'
import { getArticleList, getCategoryDetail, getCategoryList } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

type Props = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  const { contents } = await getCategoryList()
  return contents.map((category) => ({ id: category.id }))
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params

  let category
  try {
    category = await getCategoryDetail(id)
  } catch {
    notFound()
  }

  const { contents } = await getArticleList({ categoryId: id })
  return <ArticleListTemplate articles={contents} heading={`カテゴリ: ${category.name}`} />
}
