// ISO日付文字列を日本語表記（例: 2026年6月1日）に整形する
export function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
