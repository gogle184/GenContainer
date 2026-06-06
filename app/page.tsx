import { getArticleList } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

export default async function Home() {
  const { contents } = await getArticleList()
  return <ArticleListTemplate articles={contents} />
}
