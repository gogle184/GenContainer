import { ArticleCard } from './ArticleCard'
import type { BlogContent } from '@/features/article/types'

type Props = {
  articles: BlogContent[]
  heading?: string
}

export function ArticleListTemplate({ articles, heading }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {heading && (
        <h1 className="font-heading mb-8 text-2xl font-bold tracking-tight">
          {heading}
        </h1>
      )}
      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          まだ記事がありません。
        </div>
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
