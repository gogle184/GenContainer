# ブログサービス Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** microCMSをデータソースにした個人ブログ（記事一覧・詳細・カテゴリ別・タグ別＋共通ヘッダー）をNext.js 16で構築し、Vercelで公開する。

**Architecture:** `app/` はルーティング配線のみ（薄く保つ）。UI・データ取得は `features/article/` のドメイン配下に集約し、Next.jsを起動せずに単体テスト可能にする。microCMSアクセスは `lib/microcms.ts` のクライアントと `features/article/api/` に閉じ込め、UIコンポーネントはデータ取得方法を知らない。

**Tech Stack:** Next.js 16.2.7 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / shadcn/ui (radix-nova) / microcms-js-sdk / Jest + @testing-library/react

---

## 重要な前提（調査で確定した事実）

実装者はこれらを必ず守ること。推測で書くと壊れる。

1. **`params` は Promise**：Next.js 16では動的ルートの `params` は Promise。必ず `const { id } = await params` で受け取る。型は `{ params: Promise<{ id: string }> }`。
2. **`getListDetail` は404で例外を投げる**：存在しないIDだと `null` ではなく例外。`try/catch` で捕捉して `notFound()`（`next/navigation` からimport）を呼ぶ。
3. **キャッシュは従来モデル**：`next.config.ts` に `cacheComponents` は無い。再検証は SDK 呼び出しの `customRequestInit: { next: { revalidate: 60 } }` で指定する（`export const revalidate` でも可だが、取得関数側に寄せる）。
4. **環境変数は既に `.env.local` に存在**：`MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY`。`NEXT_PUBLIC_` は付けない（サーバー専用）。
5. **microCMSの型**：独自フィールドのみ型に書く。`id`/`createdAt`等は `MicroCMSListContent` がSDK側で合成する。参照フィールドは `& MicroCMSListContent` を付ける。
6. **リッチテキスト**：`content` はHTML文字列で返る。`dangerouslySetInnerHTML` で描画する（最小構成のためサニタイズはVercelのHTML信頼前提＝自分しか書かないので省略。将来必要なら追加）。
7. **shadcnのコマンド**：`pnpm dlx shadcn@latest add <component>` でコンポーネントを追加（このプロジェクトは pnpm）。

---

## File Structure

新規作成・変更するファイルと責務：

```
lib/microcms.ts                              新規: microCMSクライアント（接続設定の1か所）
features/article/types.ts                    新規: Blog/Category/Tag の型定義
features/article/api/getArticles.ts          新規: 記事・カテゴリ・タグの取得関数群
features/article/api/getArticles.test.ts     新規: API層のテスト（client をモック）
features/article/components/ArticleCard.tsx          新規: 一覧の記事カード（部品）
features/article/components/ArticleCard.test.tsx     新規: カードのテスト
features/article/components/ArticleContent.tsx       新規: リッチテキスト本文の描画
features/article/components/ArticleListTemplate.tsx  新規: 一覧ページUI集約
features/article/components/ArticleDetailTemplate.tsx 新規: 詳細ページUI集約
features/article/components/ArticleDetailTemplate.test.tsx 新規: 詳細テンプレのテスト
components/layout/Header.tsx                  新規: 共通ヘッダー（shadcn Sheetでハンバーガー）
components/ui/sheet.tsx                        新規: shadcn add で生成
components/ui/card.tsx                         新規: shadcn add で生成
app/layout.tsx                                変更: Headerを差し込み・メタ情報・langをjaに
app/page.tsx                                  変更: <ArticleListTemplate /> を呼ぶだけに
app/articles/[id]/page.tsx                    新規: 記事詳細ルート
app/categories/[id]/page.tsx                  新規: カテゴリ別一覧ルート
app/tags/[id]/page.tsx                        新規: タグ別一覧ルート
jest.config.ts / jest.setup.ts                新規: Jest + testing-library 設定
package.json                                  変更: test script と依存追加
```

---

### Task 1: 依存パッケージとテスト環境のセットアップ

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: microcms-js-sdk を追加**

Run: `pnpm add microcms-js-sdk`
Expected: `package.json` の dependencies に `microcms-js-sdk` が追加される。

- [ ] **Step 2: テスト用ライブラリを追加**

Run:
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/dom jest-environment-jsdom @types/jest ts-node
```
Expected: devDependencies にtesting-library一式が追加される（`jest`は導入済み）。

- [ ] **Step 3: jest.config.ts を作成**

Next.js公式のJest設定（`next/jest`）を使う。これでTypeScript/JSX/パスエイリアス（`@/`）が自動で解決される。

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // next.config と .env をテストに読み込ませるため、アプリのルートを指定
  dir: './',
})

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 4: jest.setup.ts を作成**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: package.json に test スクリプトを追加**

`scripts` に以下を追加：
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: 動作確認用のダミーテストで設定が通るか確認**

一時ファイル `sanity.test.ts` をルートに作成：
```ts
test('jestが動く', () => {
  expect(1 + 1).toBe(2)
})
```

Run: `pnpm test sanity`
Expected: PASS（1 passed）。確認できたら `sanity.test.ts` を削除する。

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml jest.config.ts jest.setup.ts
git commit -m "テスト環境とmicroCMS SDKを追加"
```

---

### Task 2: microCMSクライアント

**Files:**
- Create: `lib/microcms.ts`

- [ ] **Step 1: クライアントを実装**

環境変数が無いと起動時に分かるよう、明示的にチェックしてからクライアントを作る。

```ts
import { createClient } from 'microcms-js-sdk'

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is required')
}
if (!process.env.MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is required')
}

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
})
```

- [ ] **Step 2: 型チェックが通るか確認**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし（このファイル起因のエラーが出ないこと）。

- [ ] **Step 3: Commit**

```bash
git add lib/microcms.ts
git commit -m "microCMSクライアントを追加"
```

---

### Task 3: 型定義

**Files:**
- Create: `features/article/types.ts`

- [ ] **Step 1: 型を定義**

独自フィールドのみ定義。標準フィールド（id/日付）は `MicroCMSListContent` がSDK側で合成する。参照フィールドには `& MicroCMSListContent` を付けて、展開時に返る id/日付に型を付ける。

```ts
import type { MicroCMSImage, MicroCMSListContent } from 'microcms-js-sdk'

// カテゴリ（categories エンドポイント）
export type Category = {
  name: string
}

// タグ（tags エンドポイント）
export type Tag = {
  name: string
}

// 記事（blogs エンドポイント）の独自フィールド
export type Blog = {
  title: string
  content: string // リッチエディタ → HTML文字列
  eyecatch?: MicroCMSImage
  category?: Category & MicroCMSListContent // コンテンツ参照（単数）
  tags?: (Tag & MicroCMSListContent)[] // 複数コンテンツ参照
}

// 一覧・詳細で受け取るときの完全な型（標準フィールド込み）
export type BlogContent = Blog & MicroCMSListContent
export type CategoryContent = Category & MicroCMSListContent
export type TagContent = Tag & MicroCMSListContent
```

- [ ] **Step 2: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 3: Commit**

```bash
git add features/article/types.ts
git commit -m "記事・カテゴリ・タグの型定義を追加"
```

---

### Task 4: API層（記事取得関数）

**Files:**
- Create: `features/article/api/getArticles.ts`
- Test: `features/article/api/getArticles.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`client` をモックして、各取得関数が正しいendpoint・queriesでSDKを呼ぶことを検証する。

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test getArticles`
Expected: FAIL（`getArticleList is not a function` 等、関数が未定義）。

- [ ] **Step 3: 取得関数を実装**

```ts
import { client } from '@/lib/microcms'
import type { BlogContent, CategoryContent, TagContent } from '@/features/article/types'

// 60秒ごとに再検証（公開記事が一定時間で反映される）
const revalidate = { next: { revalidate: 60 } }

type ArticleListOptions = {
  categoryId?: string
  tagId?: string
}

// 記事一覧（カテゴリ/タグでの絞り込みに対応）
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

// 記事詳細（存在しないIDは例外を投げる→呼び出し側でnotFound()）
export async function getArticleDetail(contentId: string) {
  return client.getListDetail<BlogContent>({
    endpoint: 'blogs',
    contentId,
    customRequestInit: revalidate,
  })
}

// カテゴリ1件取得（ページ見出し用）
export async function getCategoryDetail(contentId: string) {
  return client.getListDetail<CategoryContent>({
    endpoint: 'categories',
    contentId,
    customRequestInit: revalidate,
  })
}

// タグ1件取得（ページ見出し用）
export async function getTagDetail(contentId: string) {
  return client.getListDetail<TagContent>({
    endpoint: 'tags',
    contentId,
    customRequestInit: revalidate,
  })
}

// 全カテゴリ取得（ヘッダーのメニュー用）
export async function getCategoryList() {
  return client.getList<CategoryContent>({
    endpoint: 'categories',
    queries: { limit: 100 },
    customRequestInit: revalidate,
  })
}

// 全タグ取得
export async function getTagList() {
  return client.getList<TagContent>({
    endpoint: 'tags',
    queries: { limit: 100 },
    customRequestInit: revalidate,
  })
}
```

> 注意: Step1のテストは `getCategoryList`/`getTagList` をimportしているが、テストケースとしては検証していない。importだけ通ればよい。テストが赤くなる場合はimport名と実装の関数名が一致しているか確認すること。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test getArticles`
Expected: PASS（4 passed）。

- [ ] **Step 5: Commit**

```bash
git add features/article/api/getArticles.ts features/article/api/getArticles.test.ts
git commit -m "記事・カテゴリ・タグの取得関数を追加"
```

---

### Task 5: shadcnコンポーネントの追加

**Files:**
- Create: `components/ui/card.tsx`
- Create: `components/ui/sheet.tsx`

- [ ] **Step 1: Card と Sheet を追加**

Run: `pnpm dlx shadcn@latest add card sheet`
Expected: `components/ui/card.tsx` と `components/ui/sheet.tsx` が生成される。依存（@radix-ui関連）が自動追加される場合がある。

- [ ] **Step 2: 生成を確認**

Run: `ls components/ui`
Expected: `button.tsx card.tsx sheet.tsx` が並ぶ。

- [ ] **Step 3: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 4: Commit**

```bash
git add components/ui package.json pnpm-lock.yaml
git commit -m "shadcnのCardとSheetを追加"
```

---

### Task 6: ArticleCard（一覧の記事カード）

**Files:**
- Create: `features/article/components/ArticleCard.tsx`
- Test: `features/article/components/ArticleCard.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

カードがタイトル・カテゴリ名を表示し、記事詳細へのリンクを持つことを検証する。

```tsx
import { render, screen } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'
import type { BlogContent } from '@/features/article/types'

const baseArticle: BlogContent = {
  id: 'abc123',
  title: 'はじめての記事',
  content: '<p>本文</p>',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  publishedAt: '2026-06-01T00:00:00.000Z',
  category: {
    id: 'tech',
    name: 'プログラミング',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
}

test('タイトルを表示する', () => {
  render(<ArticleCard article={baseArticle} />)
  expect(screen.getByText('はじめての記事')).toBeInTheDocument()
})

test('カテゴリ名を表示する', () => {
  render(<ArticleCard article={baseArticle} />)
  expect(screen.getByText('プログラミング')).toBeInTheDocument()
})

test('記事詳細へのリンクを持つ', () => {
  render(<ArticleCard article={baseArticle} />)
  const link = screen.getByRole('link', { name: /はじめての記事/ })
  expect(link).toHaveAttribute('href', '/articles/abc123')
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test ArticleCard`
Expected: FAIL（`ArticleCard` が見つからない）。

- [ ] **Step 3: ArticleCard を実装**

```tsx
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
```

> 注意: `next/image` で外部画像（microCMSのCDN）を使うため、Task 11で `next.config.ts` に画像ドメイン許可を追加する。テスト時は `next/image` がそのまま `img` として描画されるので問題ない。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test ArticleCard`
Expected: PASS（3 passed）。

- [ ] **Step 5: Commit**

```bash
git add features/article/components/ArticleCard.tsx features/article/components/ArticleCard.test.tsx
git commit -m "記事カードコンポーネントを追加"
```

---

### Task 7: ArticleContent（リッチテキスト本文）と ArticleListTemplate

**Files:**
- Create: `features/article/components/ArticleContent.tsx`
- Create: `features/article/components/ArticleListTemplate.tsx`

- [ ] **Step 1: ArticleContent を実装**

microCMSのHTML文字列を描画する。Tailwindの`prose`相当のスタイルは最小構成として基本的なものだけ当てる。

```tsx
export function ArticleContent({ html }: { html: string }) {
  return (
    <div
      className="max-w-none leading-relaxed [&_a]:underline [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-4 [&_img]:rounded [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

- [ ] **Step 2: ArticleListTemplate を実装**

一覧ページのUIを集約。記事配列を受け取り、カードのグリッドを描画。空のときはメッセージ。

```tsx
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
```

- [ ] **Step 3: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 4: Commit**

```bash
git add features/article/components/ArticleContent.tsx features/article/components/ArticleListTemplate.tsx
git commit -m "本文描画と一覧テンプレートを追加"
```

---

### Task 8: ArticleDetailTemplate（詳細ページUI）

**Files:**
- Create: `features/article/components/ArticleDetailTemplate.tsx`
- Test: `features/article/components/ArticleDetailTemplate.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

タイトル・本文HTML・タグリンクが描画されることを検証。

```tsx
import { render, screen } from '@testing-library/react'
import { ArticleDetailTemplate } from './ArticleDetailTemplate'
import type { BlogContent } from '@/features/article/types'

const article: BlogContent = {
  id: 'abc123',
  title: '詳細記事',
  content: '<p>これは本文です</p>',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  publishedAt: '2026-06-01T00:00:00.000Z',
  tags: [
    { id: 'nextjs', name: 'Next.js', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
  ],
}

test('タイトルを表示する', () => {
  render(<ArticleDetailTemplate article={article} />)
  expect(screen.getByRole('heading', { name: '詳細記事' })).toBeInTheDocument()
})

test('本文HTMLを描画する', () => {
  render(<ArticleDetailTemplate article={article} />)
  expect(screen.getByText('これは本文です')).toBeInTheDocument()
})

test('タグへのリンクを持つ', () => {
  render(<ArticleDetailTemplate article={article} />)
  const link = screen.getByRole('link', { name: 'Next.js' })
  expect(link).toHaveAttribute('href', '/tags/nextjs')
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test ArticleDetailTemplate`
Expected: FAIL（コンポーネント未定義）。

- [ ] **Step 3: ArticleDetailTemplate を実装**

```tsx
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test ArticleDetailTemplate`
Expected: PASS（3 passed）。

- [ ] **Step 5: Commit**

```bash
git add features/article/components/ArticleDetailTemplate.tsx features/article/components/ArticleDetailTemplate.test.tsx
git commit -m "記事詳細テンプレートを追加"
```

---

### Task 9: 共通ヘッダー（shadcn Sheetでハンバーガー）

**Files:**
- Create: `components/layout/Header.tsx`

- [ ] **Step 1: Header を実装**

PCは横並びリンク、スマホはハンバーガー（Sheet）。Sheetは開閉状態を持つのでクライアントコンポーネント（`'use client'`）。カテゴリ一覧はサーバー側で取得してpropsで渡す（後述のlayoutで取得）。

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { CategoryContent } from '@/features/article/types'

type Props = {
  siteName: string
  categories: CategoryContent[]
}

export function Header({ siteName, categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          {siteName}
        </Link>

        {/* PC表示: 横並びリンク */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm hover:underline">
            ホーム
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="text-sm hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* スマホ表示: ハンバーガー */}
        <div className="sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="メニューを開く">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>メニュー</SheetTitle>
              <nav className="mt-6 flex flex-col gap-4">
                <Link href="/" onClick={() => setOpen(false)} className="hover:underline">
                  ホーム
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.id}`}
                    onClick={() => setOpen(false)}
                    className="hover:underline"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし。`SheetTitle` がshadcnのsheet.tsxにexportされているか確認（無ければ生成ファイルのexportを見て名前を合わせる）。

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "共通ヘッダーを追加"
```

---

### Task 10: ルーティング配線（layout / page / 動的ルート）

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/articles/[id]/page.tsx`
- Create: `app/categories/[id]/page.tsx`
- Create: `app/tags/[id]/page.tsx`

- [ ] **Step 1: app/layout.tsx を変更**

`lang`を`ja`に、Headerを差し込む。カテゴリはサーバー側で取得してHeaderに渡す。

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { getCategoryList } from '@/features/article/api/getArticles'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_NAME = 'My Blog'

export const metadata: Metadata = {
  title: SITE_NAME,
  description: '個人ブログ',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { contents: categories } = await getCategoryList()

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header siteName={SITE_NAME} categories={categories} />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: app/page.tsx を変更（トップ＝記事一覧）**

```tsx
import { getArticleList } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

export default async function Home() {
  const { contents } = await getArticleList()
  return <ArticleListTemplate articles={contents} />
}
```

- [ ] **Step 3: app/articles/[id]/page.tsx を作成（記事詳細）**

`params`はPromise。`getArticleDetail`は404で例外→try/catchで`notFound()`。`generateMetadata`でタイトルを動的に。

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getArticleDetail } from '@/features/article/api/getArticles'
import { ArticleDetailTemplate } from '@/features/article/components/ArticleDetailTemplate'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const article = await getArticleDetail(id)
    return { title: article.title }
  } catch {
    return { title: '記事が見つかりません' }
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params

  let article
  try {
    article = await getArticleDetail(id)
  } catch {
    notFound()
  }

  return <ArticleDetailTemplate article={article} />
}
```

- [ ] **Step 4: app/categories/[id]/page.tsx を作成（カテゴリ別一覧）**

```tsx
import { notFound } from 'next/navigation'
import { getArticleList, getCategoryDetail } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

type Props = { params: Promise<{ id: string }> }

export default async function CategoryPage({ params }: Props) {
  const { id } = await params

  let category
  try {
    category = await getCategoryDetail(id)
  } catch {
    notFound()
  }

  const { contents } = await getArticleList({ categoryId: id })
  return <ArticleListTemplate articles={contents} heading={`カテゴリ: ${category.name}`} />
}
```

- [ ] **Step 5: app/tags/[id]/page.tsx を作成（タグ別一覧）**

```tsx
import { notFound } from 'next/navigation'
import { getArticleList, getTagDetail } from '@/features/article/api/getArticles'
import { ArticleListTemplate } from '@/features/article/components/ArticleListTemplate'

type Props = { params: Promise<{ id: string }> }

export default async function TagPage({ params }: Props) {
  const { id } = await params

  let tag
  try {
    tag = await getTagDetail(id)
  } catch {
    notFound()
  }

  const { contents } = await getArticleList({ tagId: id })
  return <ArticleListTemplate articles={contents} heading={`タグ: ${tag.name}`} />
}
```

- [ ] **Step 6: 型チェック**

Run: `pnpm exec tsc --noEmit`
Expected: エラーなし。

- [ ] **Step 7: Commit**

```bash
git add app/
git commit -m "ルーティングとページを配線"
```

---

### Task 11: 画像ドメイン許可と全テスト・ビルド確認

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: next.config.ts に microCMS の画像ドメインを許可**

microCMSの画像CDN（`images.microcms-assets.io`）を`next/image`で使えるようにする。

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: 全テストを実行**

Run: `pnpm test`
Expected: 全てPASS（getArticles / ArticleCard / ArticleDetailTemplate）。

- [ ] **Step 3: 本番ビルドが通るか確認**

Run: `pnpm build`
Expected: ビルド成功。`.env.local` が読まれてmicroCMSから実データを取得できること。エラーが出たら環境変数とmicroCMSのフィールドID（title/content/eyecatch/category/tags）が設計と一致しているか確認。

- [ ] **Step 4: 開発サーバーで目視確認**

Run: `pnpm dev`
ブラウザで `http://localhost:3000` を開き、以下を確認：
- トップに記事一覧が出る（テスト記事が1本でも表示される）
- 記事カードをクリックして詳細が開く
- カテゴリ/タグのリンクで絞り込み一覧が出る
- スマホ幅にするとハンバーガーが出て開閉する
- 存在しないURL（例 `/articles/notexist`）で404になる

- [ ] **Step 5: Commit**

```bash
git add next.config.ts
git commit -m "microCMS画像ドメインを許可"
```

---

### Task 12: Vercelデプロイ

**Files:** なし（Vercel管理画面 + CLI操作）

- [ ] **Step 1: GitHubリポジトリに push**

mainブランチをGitHubに push（リポジトリ未作成ならghで作成）。`.env.local`は`.gitignore`済みなのでpushされないことを確認。

- [ ] **Step 2: Vercelにプロジェクトを作成**

deploy-to-vercel スキル または vercel-cli-with-tokens スキルを使う。GitHubリポジトリを連携。

- [ ] **Step 3: Vercelに環境変数を登録**

Vercelの Project Settings → Environment Variables に以下を追加（`.env.local`と同じ値）：
- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`

- [ ] **Step 4: デプロイと動作確認**

デプロイ後の本番URLで、ローカルと同じ動作（一覧・詳細・絞り込み・ハンバーガー）を確認する。

---

## 完成の定義

- [ ] トップで記事一覧が表示される
- [ ] 記事詳細がリッチテキストで表示される
- [ ] カテゴリ別・タグ別の絞り込み一覧が動く
- [ ] スマホでハンバーガーメニューが開閉する
- [ ] 存在しない記事IDで404になる
- [ ] `pnpm test` が全てパスする
- [ ] Vercelの本番URLで公開されている
- [ ] microCMSで記事を公開すると最大60秒で本番に反映される
