import type { MicroCMSImage, MicroCMSListContent } from 'microcms-js-sdk'

export type Category = {
  name: string
}

export type Tag = {
  name: string
}

export type Blog = {
  title: string
  content: string
  eyecatch?: MicroCMSImage
  category?: Category & MicroCMSListContent
  tags?: (Tag & MicroCMSListContent)[]
}

export type BlogContent = Blog & MicroCMSListContent
export type CategoryContent = Category & MicroCMSListContent
export type TagContent = Tag & MicroCMSListContent
