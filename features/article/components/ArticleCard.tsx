import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BlogContent } from '@/features/article/types'
import { formatDate } from '@/features/article/lib/formatDate'
import { getExcerpt } from '@/features/article/lib/excerpt'

export function ArticleCard({ article }: { article: BlogContent }) {
  return (
    <Card className="group gap-0 overflow-hidden p-0 ring-foreground/10 transition-all hover:shadow-md hover:ring-foreground/20">
      <Link href={`/articles/${article.id}`} className="flex h-full flex-col">
        {article.eyecatch ? (
          <div className="overflow-hidden">
            <Image
              src={article.eyecatch.url}
              alt=""
              width={article.eyecatch.width ?? 800}
              height={article.eyecatch.height ?? 450}
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted" />
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {article.category && (
            <Badge variant="secondary" className="w-fit font-normal">
              {article.category.name}
            </Badge>
          )}
          <h3 className="font-heading line-clamp-2 text-base font-medium leading-snug">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {getExcerpt(article.content)}
          </p>
          <time
            dateTime={article.publishedAt}
            className="mt-auto pt-1 text-xs text-muted-foreground"
          >
            {formatDate(article.publishedAt)}
          </time>
        </div>
      </Link>
    </Card>
  )
}
