import Link from 'next/link'
import Image from 'next/image'
import { ArticleContent } from './ArticleContent'
import type { BlogContent } from '@/features/article/types'

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ArticleDetailTemplate({ article }: { article: BlogContent }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <article>
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {article.category && (
            <Link href={`/categories/${article.category.id}`} className="underline">
              {article.category.name}
            </Link>
          )}
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
        {article.eyecatch && (
          <Image
            src={article.eyecatch.url}
            alt=""
            width={article.eyecatch.width ?? 1200}
            height={article.eyecatch.height ?? 675}
            className="mt-6 w-full rounded object-cover"
            priority
          />
        )}
        <div className="mt-8">
          <ArticleContent html={article.content} />
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.id}`}
                className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
