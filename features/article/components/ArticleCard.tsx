import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BlogContent } from '@/features/article/types'

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ArticleCard({ article }: { article: BlogContent }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/articles/${article.id}`} className="block">
        {article.eyecatch && (
          <Image
            src={article.eyecatch.url}
            alt=""
            width={article.eyecatch.width ?? 800}
            height={article.eyecatch.height ?? 450}
            className="aspect-video w-full object-cover"
          />
        )}
        <CardHeader>
          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          {article.category && <span>{article.category.name}</span>}
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </CardContent>
      </Link>
    </Card>
  )
}
