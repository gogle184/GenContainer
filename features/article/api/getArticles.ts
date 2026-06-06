import { client } from '@/lib/microcms'
import type { BlogContent, CategoryContent, TagContent } from '@/features/article/types'

const revalidate = { next: { revalidate: 60 } }

type ArticleListOptions = {
  categoryId?: string
  tagId?: string
}

export async function getArticleList(options: ArticleListOptions = {}) {
  const queries: Record<string, unknown> = { orders: '-publishedAt', limit: 100 }

  if (options.categoryId) {
    queries.filters = `category[equals]${options.categoryId}`
  } else if (options.tagId) {
    queries.filters = `tags[contains]${options.tagId}`
  }

  return client.getList<BlogContent>({
    endpoint: 'blogs',
    queries,
    customRequestInit: revalidate,
  })
}

export async function getArticleDetail(contentId: string) {
  return client.getListDetail<BlogContent>({
    endpoint: 'blogs',
    contentId,
    customRequestInit: revalidate,
  })
}

export async function getCategoryDetail(contentId: string) {
  return client.getListDetail<CategoryContent>({
    endpoint: 'categories',
    contentId,
    customRequestInit: revalidate,
  })
}

export async function getTagDetail(contentId: string) {
  return client.getListDetail<TagContent>({
    endpoint: 'tags',
    contentId,
    customRequestInit: revalidate,
  })
}

export async function getCategoryList() {
  return client.getList<CategoryContent>({
    endpoint: 'categories',
    queries: { limit: 100 },
    customRequestInit: revalidate,
  })
}

export async function getTagList() {
  return client.getList<TagContent>({
    endpoint: 'tags',
    queries: { limit: 100 },
    customRequestInit: revalidate,
  })
}
