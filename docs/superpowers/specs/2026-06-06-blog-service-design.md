# ブログサービス 設計書

作成日: 2026-06-06

## 目的

自分だけが記事を投稿する個人ブログを、**最短で公開できる状態**にする。
記事の投稿・管理は自作せず、ヘッドレスCMS（microCMS）に任せる。
今回作るのは「読者が見るブログ本体（表示側）」のみ。

## 方針（決定事項）

- **優先**: とにかく早く公開（仕組みの深い理解は後回しでよい）
- **CMS**: microCMS（日本製・管理画面/ドキュメントが日本語・無料枠で十分）
- **デプロイ**: Vercel（Next.js製造元なので相性最良・GitHub連携で自動公開）
- **デザイン**: 最小構成（白背景＋読みやすい文字＋Tailwindで軽く整える）
- **UI部品**: shadcn/ui を活用（導入済み: components.json, lib/utils.ts, button.tsx, radix-ui, lucide-react）
- **スコープ外（YAGNI）**: 記事検索、SEO/OGP最適化、コメント機能、複数ユーザー投稿

## 技術スタック（現状）

- Next.js 16.2.7 / React 19.2.7（App Router）
- Tailwind CSS v4
- TypeScript
- shadcn/ui（style: radix-nova, icon: lucide）
- microcms-js-sdk（※実装時に追加）

> ⚠️ 注意: 本プロジェクトの `AGENTS.md` により、これは通常のNext.jsと異なる可能性がある。
> 実装前に必ず `node_modules/next/dist/docs/` の該当ガイドを確認してからコードを書く。

## 全体構成

```
[あなた] --記事を書く--> [microCMS（管理画面＆データ保存）]
                                 |
                                 | APIで記事取得（APIキーで認証・サーバー側）
                                 v
                          [Next.js 16（ブログ本体）] --表示--> [読者]
```

クロードくんは記事投稿時にコードを触らない。コードを書くのは「ブログ本体を作るとき」だけ。

## microCMS側のデータ設計（API）

3つのAPI（箱）を作る。

### blogs（記事）
| フィールド | 種類 | 必須 | 説明 |
|---|---|---|---|
| title | テキスト | ○ | 記事タイトル |
| content | リッチエディタ | ○ | 本文（見出し・太字・画像・コードブロック等） |
| eyecatch | 画像 | 任意 | アイキャッチ画像 |
| category | コンテンツ参照(categories) | 任意 | 1記事1カテゴリ |
| tags | 複数コンテンツ参照(tags) | 任意 | 1記事に複数タグ |

※ id・公開日(publishedAt)・更新日はmicroCMSが自動付与。

### categories（カテゴリ）
| フィールド | 種類 | 必須 | 説明 |
|---|---|---|---|
| name | テキスト | ○ | カテゴリ名 |

### tags（タグ）
| フィールド | 種類 | 必須 | 説明 |
|---|---|---|---|
| name | テキスト | ○ | タグ名 |

## 画面構成

| パス | 画面 | 内容 |
|---|---|---|
| `/` | トップ＝記事一覧 | 記事カード（タイトル・アイキャッチ・日付・カテゴリ）が並ぶ |
| `/articles/[id]` | 記事詳細 | タイトル・本文(リッチテキスト)・カテゴリ・タグ・日付 |
| `/categories/[id]` | カテゴリ別一覧 | そのカテゴリの記事だけ並ぶ |
| `/tags/[id]` | タグ別一覧 | そのタグの記事だけ並ぶ |

`[id]` は microCMS が自動付与する記事固有ID（例: `/articles/abc123`）。

## 共通ヘッダー（ナビバー）

- Next.jsのレイアウト（`app/layout.tsx`）で全ページ共通表示。
- PC表示: `[ブログ名]` ＋ `ホーム` ＋ `カテゴリ`
- スマホ表示: `[ブログ名]` ＋ ハンバーガー（☰）。タップでメニュー開閉。
- 中身は最小限に絞る（ブログ名＝トップへのリンク / ホーム / カテゴリ）。

### shadcn部品の割り当て
| 作るもの | shadcn部品 | 備考 |
|---|---|---|
| ハンバーガーメニュー | Sheet | 開閉ロジック込みの完成品。自前JS不要 |
| メニュー内ボタン | Button | 導入済み |
| アイコン（☰など） | lucide-react（Menu等） | 導入済み |
| 記事カード | Card | 一覧の見栄えを楽に整える |

## ディレクトリ構成（featureベース）

責務分離の方針：`app/` はルーティング配線のみに薄く保ち、UI・hooksは `features/` のドメイン配下に集約する。
これによりNext.jsを起動せずにコンポーネント単体テスト/UIテストが可能になる。

> ⚠️ 命名の注意: `app/` 配下に `template.tsx` という名前は**使わない**。
> これはNext.jsの予約ファイル（ページ移動ごとに再マウントする特殊挙動）で意図と衝突する。
> Templateコンポーネント（Atomic Design的なページUI集約層）は `features/` 配下に
> `XxxTemplate.tsx` の名前で置く。

```
app/                              ← ルーティング専用（薄く保つ）
├─ layout.tsx                     ← 共通ヘッダー（常時表示＝layoutが正解）
├─ page.tsx                       → <ArticleListTemplate /> をimportするだけ
├─ articles/[id]/page.tsx         → <ArticleDetailTemplate id={id} />
├─ categories/[id]/page.tsx       → <CategoryTemplate id={id} />
└─ tags/[id]/page.tsx             → <TagTemplate id={id} />

features/                         ← ドメインごとに掘り下げる本体
└─ article/                       ← 「記事」ドメイン
   ├─ components/
   │  ├─ ArticleListTemplate.tsx  ← 一覧ページのUI集約（テスト対象）
   │  ├─ ArticleDetailTemplate.tsx← 詳細ページのUI集約
   │  ├─ ArticleCard.tsx          ← 部品
   │  └─ ArticleContent.tsx       ← リッチテキスト本文の描画
   ├─ hooks/                      ← このドメイン用のhooks
   ├─ api/
   │  └─ getArticles.ts           ← microCMSから記事取得（この層に閉じ込める）
   └─ types.ts                    ← 記事の型定義

components/                       ← 横断的に使う共通UI
├─ ui/                            ← shadcn（button.tsx 等）※自動生成、原則触らない
└─ layout/
   └─ Header.tsx                  ← ヘッダー本体（Sheetでハンバーガー）

lib/
├─ microcms.ts                    ← microCMSクライアント（接続設定の1か所）
└─ utils.ts                       ← cn() ※shadcn既存
```

- `app/` は配線だけ。テスト対象UIは `features/` 側に集約。
- ドメイン（article）ごとにフォルダを掘る。カテゴリ/タグが育てば `features/category/` のように追加。
- microCMSアクセスは `features/article/api/` または `lib/microcms.ts` に閉じ込め、UIはデータ取得方法を知らない（モックしてテスト容易）。

## データの流れ

```
読者が / を開く
  → Next.jsサーバー側が microCMS にAPIリクエスト
  → APIキーは .env.local に隠す（サーバー側のみ・読者に見えない）
  → microCMS が記事JSONを返す
  → Next.js がHTMLに組み立てて表示
```

- microCMS接続は `lib/microcms.ts` の1か所に集約（`microcms-js-sdk` 使用）。
- データ取得はサーバーコンポーネントで行う（APIキー秘匿のため）。
- 本文(content)はHTMLで返るため、サニタイズしてから表示する。
- 記事の更新反映: 時間ベースの revalidate を設定（公開記事が一定時間で反映）。

## 環境変数

| 変数名 | 用途 |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | microCMSのサービスドメイン |
| `MICROCMS_API_KEY` | microCMSのAPIキー |

- `.env.local` に記載し、**`.gitignore`で必ず除外**（GitHubに漏らさない）。
- Vercelには管理画面の Environment Variables に同じ値を登録。

## エラーハンドリング

- 存在しない記事ID → Next.jsの `notFound()` で404表示。
- API取得失敗 → エラー表示（読者に分かるメッセージ）。
- 記事0件 → 「まだ記事がありません」表示。

## 公開フロー

```
GitHubにpush → Vercelが自動ビルド＆公開 → URL発行
microCMSで記事公開 → ブログに自動反映（revalidate）
```

## 将来の拡張余地（今はやらない）

- 検索・SEO/OGP対応
- microCMS Webhookによる on-demand revalidation（即時反映）
- Cloudflareへの移行（コスト最適化が必要になったら）
