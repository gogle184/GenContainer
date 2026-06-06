import { getArticleList, getArticleDetail, getCategoryList, getTagList } from './getArticles'
import { client } from '@/lib/microcms'

jest.mock('@/lib/microcms', () => ({
  client: {
    getList: jest.fn(),
    getListDetail: jest.fn(),
  },
}))

const mockedClient = client as unknown as {
  getList: jest.Mock
  getListDetail: jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('getArticleList は blogs を publishedAt降順・revalidate付きで取得する', async () => {
  mockedClient.getList.mockResolvedValue({ contents: [], totalCount: 0, limit: 10, offset: 0 })

  await getArticleList()

  expect(mockedClient.getList).toHaveBeenCalledWith({
    endpoint: 'blogs',
    queries: { orders: '-publishedAt', limit: 100 },
    customRequestInit: { next: { revalidate: 60 } },
  })
})

test('getArticleDetail は contentId を指定して1件取得する', async () => {
  mockedClient.getListDetail.mockResolvedValue({ id: 'abc', title: 't', content: '<p>x</p>' })

  const result = await getArticleDetail('abc')

  expect(mockedClient.getListDetail).toHaveBeenCalledWith({
    endpoint: 'blogs',
    contentId: 'abc',
    customRequestInit: { next: { revalidate: 60 } },
  })
  expect(result.id).toBe('abc')
})

test('getArticleList はカテゴリIDで絞り込める', async () => {
  mockedClient.getList.mockResolvedValue({ contents: [], totalCount: 0, limit: 10, offset: 0 })

  await getArticleList({ categoryId: 'tech' })

  expect(mockedClient.getList).toHaveBeenCalledWith({
    endpoint: 'blogs',
    queries: { orders: '-publishedAt', limit: 100, filters: 'category[equals]tech' },
    customRequestInit: { next: { revalidate: 60 } },
  })
})

test('getArticleList はタグIDで絞り込める', async () => {
  mockedClient.getList.mockResolvedValue({ contents: [], totalCount: 0, limit: 10, offset: 0 })

  await getArticleList({ tagId: 'nextjs' })

  expect(mockedClient.getList).toHaveBeenCalledWith({
    endpoint: 'blogs',
    queries: { orders: '-publishedAt', limit: 100, filters: 'tags[contains]nextjs' },
    customRequestInit: { next: { revalidate: 60 } },
  })
})
