// リッチエディタのHTML文字列からプレーンテキストの抜粋を作る。
// タグを除去し、連続する空白を1つにまとめ、指定文字数で切り詰める。
export function getExcerpt(html: string, length = 120): string {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= length) return text
  return `${text.slice(0, length)}…`
}
