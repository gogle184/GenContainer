import Link from 'next/link'
import Image from 'next/image'
import { ArticleContent } from './ArticleContent'
import { Badge } from '@/components/ui/badge'
import type { BlogContent } from '@/features/article/types'
import { formatDate } from '@/features/article/lib/formatDate'

export function ArticleDetailTemplate({ article }: { article: BlogContent }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <article>
        <header className="flex flex-col gap-4">
          {article.category && (
            <Link href={`/categories/${article.category.id}`} className="w-fit">
              <Badge variant="secondary" className="font-normal">
                {article.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          <time
            dateTime={article.publishedAt}
            className="text-sm text-muted-foreground"
          >
            {formatDate(article.publishedAt)}
          </time>
        </header>
        {article.eyecatch && (
          <Image
            src={article.eyecatch.url}
            alt=""
            width={article.eyecatch.width ?? 1200}
            height={article.eyecatch.height ?? 675}
            className="mt-8 aspect-video w-full rounded-xl object-cover ring-1 ring-foreground/10"
            priority
          />
        )}
        <div className="mt-10">
          <ArticleContent html={article.content} />
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.id}`}
                className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
