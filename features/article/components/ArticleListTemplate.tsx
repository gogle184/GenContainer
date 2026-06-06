import { ArticleCard } from './ArticleCard'
import type { BlogContent } from '@/features/article/types'

type Props = {
  articles: BlogContent[]
  heading?: string
}

export function ArticleListTemplate({ articles, heading }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {heading && <h1 className="mb-6 text-2xl font-bold">{heading}</h1>}
      {articles.length === 0 ? (
        <p className="text-muted-foreground">まだ記事がありません。</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  )
}
