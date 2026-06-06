import { notFound } from 'next/navigation'
import { getArticleList, getTagDetail, getTagList } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

type Props = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  const { contents } = await getTagList()
  return contents.map((tag) => ({ id: tag.id }))
}

export default async function TagPage({ params }: Props) {
  const { id } = await params

  let tag
  try {
    tag = await getTagDetail(id)
  } catch {
    notFound()
  }

  const { contents } = await getArticleList({ tagId: id })
  return <ArticleListTemplate articles={contents} heading={`タグ: ${tag.name}`} />
}
